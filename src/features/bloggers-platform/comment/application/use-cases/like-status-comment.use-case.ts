import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { CommentDocument } from '../../domain/comment.entity';
import { NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { LikeStatusClass, LikeStatusDocument, LikeStatusType, Status } from '../../domain/likeStatus.schema';
import { CommentRepository } from '../../infrastructure/comment.repository';

export class LikeStatusCommentUseCaseCommand {
  constructor(public commentId: string, public userId: string, public likeStatus: string) {
  }
}

@CommandHandler(LikeStatusCommentUseCaseCommand)
export class LikeStatusCommentUseCase implements ICommandHandler<LikeStatusCommentUseCaseCommand> {
  constructor(private commentsRepository: CommentRepository,
              @InjectModel(LikeStatusClass.name) private LikeStatus: LikeStatusType) {
  }

  async execute(command: LikeStatusCommentUseCaseCommand){
    const {commentId, userId, likeStatus} = command
    const comment: CommentDocument | null = await this.commentsRepository.getCommentById(commentId)
    if(!comment){
      throw NotFoundDomainException.create('If comment with specified id doesn\'t exists', 'comment')
    }

    const status: LikeStatusDocument | null  = await this.LikeStatus.findOne({comment_id: commentId, user_id: userId})
    if(!status){
      const newStatus = new LikeStatusClass(userId, commentId, likeStatus)
      if(likeStatus == Status.Like){
        comment.likesInfo.likesCount++
        comment.markModified('likesInfo')
        await this.commentsRepository.save(comment)
      }
      if(likeStatus == Status.Dislike){
        comment.likesInfo.dislikesCount++
        comment.markModified('likesInfo')
        await this.commentsRepository.save(comment)
      }
      await this.LikeStatus.create(newStatus)
    }
    if(status){
      if(likeStatus == Status.None && status.status == 'Dislike'){
        comment.likesInfo.dislikesCount--
        comment.markModified('likesInfo')
      }
      if(likeStatus == Status.None && status.status == 'Like'){
        comment.likesInfo.likesCount--
        comment.markModified('likesInfo')
      }
      if(likeStatus == Status.Like && status.status == 'Dislike'){
        comment.likesInfo.likesCount++
        comment.likesInfo.dislikesCount--
        comment.markModified('likesInfo')
      }
      if(likeStatus == Status.Dislike && status.status == 'Like'){
        comment.likesInfo.likesCount--
        comment.likesInfo.dislikesCount++
        comment.markModified('likesInfo')
      }
      await this.commentsRepository.save(comment)
      status.status = likeStatus
      await this.commentsRepository.save(status)
    }
  }
}