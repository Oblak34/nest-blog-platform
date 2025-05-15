import {  BlogDocument } from '../../domain/blog.entity';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { BlogCreateDto } from '../../api/input/create-blog.dto';
import { NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateBlogUseCaseCommand {
  constructor(public id: string, public body: BlogCreateDto) {
  }
}

@CommandHandler(UpdateBlogUseCaseCommand)
export class UpdateBlogUseCase implements  ICommandHandler<UpdateBlogUseCaseCommand>{
  constructor(private blogRepository: BlogRepository){}

  async execute(command: UpdateBlogUseCaseCommand): Promise< true | null>{
    const blog: BlogDocument | null = await this.blogRepository.findById(command.id)
    if(!blog) {
      throw NotFoundDomainException.create('blog not exist', 'blog')
    }
    blog.updatedBlog(command.body)
    await this.blogRepository.save(blog)
    return true
  }
}