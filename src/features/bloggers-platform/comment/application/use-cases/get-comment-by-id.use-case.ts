import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { CommentDocument, CommentModelType, Comment, Status } from '../../domain/comment.entity';
import { LikeStatusClass, LikeStatusDocument, LikeStatusType } from '../../domain/likeStatus.schema';

export class GetCommentByIdUseCaseCommand {
  constructor(public commentId: string, public userId: string | undefined) {
  }
}

@QueryHandler(GetCommentByIdUseCaseCommand)
export class GetCommentByIdUseCase implements IQueryHandler<GetCommentByIdUseCaseCommand> {
  constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType,
              @InjectModel(LikeStatusClass.name) private LikeStatusModel: LikeStatusType) {
  }

  async execute(command: GetCommentByIdUseCaseCommand){
    const comment: CommentDocument | null = await this.CommentModel.findOne({_id: command.commentId, deletedAt: null})
    if (!comment) {
      return null
    }
    const status: LikeStatusDocument | null = await this.LikeStatusModel.findOne({
      user_id: command.userId,
      comment_id: command.commentId
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