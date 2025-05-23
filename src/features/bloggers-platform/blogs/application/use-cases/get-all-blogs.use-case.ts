import { GetBlogsQueryParams } from '../../api/input/get-blogs-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { FilterQuery } from 'mongoose';
import { BlogViewDto } from '../../api/output/blog-view.dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export class GetAllBlogsUseCaseCommand {
  constructor(public query: GetBlogsQueryParams) {
  }
}

@QueryHandler(GetAllBlogsUseCaseCommand)
export class GetAllBlogsUseCase implements IQueryHandler<GetAllBlogsUseCaseCommand> {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async execute(command: GetAllBlogsUseCaseCommand){
    const filter: FilterQuery<Blog> = {
      deletedAt: null
    }
    if(command.query.searchNameTerm){
      filter.name = { $regex: command.query.searchNameTerm, $options: 'i' }
    }

    const blogs = await this.BlogModel.find(filter)
      .sort({ [command.query.sortBy] : command.query.sortDirection })
      .skip(command.query.calculateSkip())
      .limit(command.query.pageSize);

    const totalCount: number = await this.BlogModel.countDocuments(filter);
    const items = blogs.map(BlogViewDto.mapToView)

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: command.query.pageNumber,
      size: command.query.pageSize,
    });
  }
}