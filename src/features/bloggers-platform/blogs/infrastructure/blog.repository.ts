import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';


@Injectable()
export class BlogRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType){}
  async findById(id: string) {
    return this.BlogModel.findOne({ _id: id, deletedAt: null });
  }
  async save(blog: BlogDocument) {
    await blog.save();
  }
}