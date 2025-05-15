import { BlogDocument } from '../../domain/blog.entity';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteBlogUseCaseCommand {
  constructor(public id: string) {
  }
}

@CommandHandler(DeleteBlogUseCaseCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogUseCaseCommand>{
  constructor(private blogRepository: BlogRepository,) {}

  async execute(command: DeleteBlogUseCaseCommand): Promise< true | null> {
    const blog: BlogDocument | null = await this.blogRepository.findById(command.id)
    if (!blog) {
      throw NotFoundDomainException.create('blog not exist', 'blog')
    }
    blog.makeDeleted()
    await this.blogRepository.save(blog)
    return true
  }
}