import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenDomainException, NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { CommentRepository } from '../../infrastructure/comment.repository'
import { CommentDocument } from '../../domain/comment.entity';

export class UpdateCommentUseCaseCommand {
  constructor(public commentId: string, public content: string, public userId: string) {
  }
}

@CommandHandler(UpdateCommentUseCaseCommand)
export class UpdateCommentUseCase implements ICommandHandler<UpdateCommentUseCaseCommand> {
  constructor(private commentsRepository: CommentRepository) {}

  async execute(command: UpdateCommentUseCaseCommand) {
    const {commentId, content, userId} = command
    const comment: CommentDocument | null = await this.commentsRepository.getCommentById(commentId)
    if(!comment){
      throw NotFoundDomainException.create('Not exsist comment', 'comment')
    }

    if(comment.commentatorInfo.userId !== userId){
      throw ForbiddenDomainException.create('If try edit the comment that is not your own', 'comment')
    }
    comment.content = content
    await this.commentsRepository.save(comment)
  }
}


