import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../../domain/blog.entity';
import { BlogRepository } from '../../infrastructure/blog.repository';
import { BlogCreateDto } from '../../api/input/create-blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogUseCaseCommand {
  constructor(public dto: BlogCreateDto) {
  }
}

@CommandHandler(CreateBlogUseCaseCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogUseCaseCommand>{
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType ,
              private blogRepository: BlogRepository){}

  async execute(command: CreateBlogUseCaseCommand): Promise<string> {
    const blog: BlogDocument = this.BlogModel.createInstanse(command.dto);
    await this.blogRepository.save(blog);
    return blog._id.toString();
  }
}