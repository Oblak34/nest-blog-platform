import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { BlogViewDto } from '../api/output/blog-view.dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { GetBlogsQueryParams } from '../api/input/get-blogs-query-params.input-dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType){}

  async getById(id: string): Promise<BlogViewDto | null>{
    const blog: BlogDocument|null = await this.BlogModel.findOne({_id: id, deletedAt: null});
    if(!blog) return null
    return Blog.convertToView(blog)
  }
}