import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentModelType, Comment, CommentDocument, Status } from '../domain/comment.entity';
import { LikeStatusClass, LikeStatusDocument, LikeStatusType } from '../domain/likeStatus.schema';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { NotFoundDomainException } from '../../../../core/exception/domain-exception';

@Injectable()
export class CommentQueryRepository {
  constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType,
              @InjectModel(LikeStatusClass.name) private LikeStatusModel: LikeStatusType) {}

  async getAllComments(query, postId: string, userId?: string) {
    const comments = await this.CommentModel.find({ postId: postId })
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
    console.log(comments)
    if(!comments.length){
      throw NotFoundDomainException.create("If post for passed postId doesn't exist", "postId")
    }

    const commentsIds = comments.map((com) => com._id.toString())
    const myStatuses = await this.LikeStatusModel.find({user_id: userId, comment_id:{
        $in: commentsIds
      }}).lean()

    const dict:Record<string, LikeStatusClass> = myStatuses.reduce((acc,myStatus) => {
      acc[myStatus.comment_id] = { ...myStatus }
      return acc
    },{})

    const items= comments.map(comment => {
      const status = dict[comment._id.toString()]
      return {
        id: comment._id.toString(),
        content: comment.content,
        commentatorInfo: {
          userId: comment.commentatorInfo.userId,
          userLogin: comment.commentatorInfo.userLogin
        },
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: comment.likesInfo.likesCount,
          dislikesCount: comment.likesInfo.dislikesCount,
          myStatus: status ? status.status : Status.None
        }
      }
    })
    const totalCount: number = await this.CommentModel.countDocuments({ postId: postId });
    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize
    })
  }

  async getById(commentId: string, userId?: string) {
    const comment: CommentDocument | null = await this.CommentModel.findOne({_id: commentId, deletedAt: null})
    if (!comment) {
      return null
    }
    const status: LikeStatusDocument | null = await this.LikeStatusModel.findOne({
      user_id: userId,
      comment_id: commentId
    })

    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: status ? status.status : Status.None
      }
    }
  }
}