import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentDocument } from '../../domain/comment.entity';
import { ForbiddenDomainException, NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { CommentRepository } from '../../infrastructure/comment.repository';

export class DeleteCommentUseCaseCommand {
  constructor(public commentId: string, public userId: string) {
  }
}

@CommandHandler(DeleteCommentUseCaseCommand)
export class DeleteCommentUseCase implements ICommandHandler<DeleteCommentUseCaseCommand> {
  constructor(private commentsRepository: CommentRepository) {
  }

  async execute(command: DeleteCommentUseCaseCommand){
    const comment: CommentDocument | null = await this.commentsRepository.getCommentById(command.commentId)
    if(!comment){
      throw NotFoundDomainException.create('Not exsist comment', 'comment')
    }

    if(comment.commentatorInfo.userId !== command.userId){
      throw ForbiddenDomainException.create('If try edit the comment that is not your own', 'comment')
    }

    comment.deletedAt = new Date()
    await this.commentsRepository.save(comment)
  }
}