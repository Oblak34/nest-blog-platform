import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { CommentModelType, Status, Comment } from '../../domain/comment.entity';
import { LikeStatusClass, LikeStatusType } from '../../domain/likeStatus.schema';
import { GetCommentsQueryParams } from '../../api/input/get-comments-query-params';
import { NotFoundDomainException } from '../../../../../core/exception/domain-exception';

export class GetCommentsUseCaseCommand {
  constructor(public query: GetCommentsQueryParams, public postId: string, public userId: string|undefined) {
  }
}

@QueryHandler(GetCommentsUseCaseCommand)
export class GetCommentsUseCase implements IQueryHandler<GetCommentsUseCaseCommand> {
  constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType,
              @InjectModel(LikeStatusClass.name) private LikeStatusModel: LikeStatusType) {}

  async execute(command: GetCommentsUseCaseCommand){
    const comments = await this.CommentModel.find({ postId: command.postId })
      .sort({ [command.query.sortBy]: command.query.sortDirection })
      .skip(command.query.calculateSkip())
      .limit(command.query.pageSize)
    console.log(comments)
    if(!comments.length){
      throw NotFoundDomainException.create("If post for passed postId doesn't exist", "postId")
    }

    const commentsIds = comments.map((com) => com._id.toString())
    const myStatuses = await this.LikeStatusModel.find({user_id: command.userId, comment_id:{
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
  }
}