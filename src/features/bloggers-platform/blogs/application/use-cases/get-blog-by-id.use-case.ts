import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../../domain/blog.entity';

export class GetBlogByIdUseCaseCommand {
  constructor(public id: string) {
  }
}

@QueryHandler(GetBlogByIdUseCaseCommand)
export class GetBlogByIdUseCase implements IQueryHandler<GetBlogByIdUseCaseCommand> {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {
  }

  async execute(command: GetBlogByIdUseCaseCommand){
    const blog: BlogDocument|null = await this.BlogModel.findOne({_id: command.id, deletedAt: null});
    if(!blog) return null
    return Blog.convertToView(blog)
  }
}