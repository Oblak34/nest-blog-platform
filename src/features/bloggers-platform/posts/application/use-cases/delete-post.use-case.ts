import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { PostDocument } from '../../domain/post.entity';

export class DeletePostUseCaseCommand {
  constructor(public id: string) {
  }
}

@CommandHandler(DeletePostUseCaseCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostUseCaseCommand> {
  constructor(private postRepository: PostRepository,) {
  }
  async execute(command: DeletePostUseCaseCommand){
    const post: PostDocument | null = await this.postRepository.getById(command.id)
    if(!post) return null
    post.makeDeleted()
    await this.postRepository.save(post)
    return true
  }
}