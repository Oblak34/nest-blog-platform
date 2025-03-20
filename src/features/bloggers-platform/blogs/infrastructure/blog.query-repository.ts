import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { BlogViewDto } from '../api/blog-view.dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../api/get-blogs-query-params.input-dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType){}
  async getById(id: string): Promise<BlogViewDto | null>{
    const blog: BlogDocument|null = await this.BlogModel.findOne({_id: id, deletedAt: null});
    if(!blog) return null
    return Blog.convertToView(blog)
  }
  async getAllBlogs(query: GetBlogsQueryParams): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: FilterQuery<Blog> = {
      deletedAt: null
    }
    if(query.searchNameTerm){
      filter.name = { $regex: query.searchNameTerm, $options: 'i' }
    }

    const blogs = await this.BlogModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount: number = await this.BlogModel.countDocuments(filter);
    const items = blogs.map(BlogViewDto.mapToView)

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}