import { Injectable } from '@nestjs/common';
import { BlogCreateDto } from '../api/create-blog.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { BlogRepository } from '../infrastructure/blog.repository';

@Injectable()
export class BlogService {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType ,
    private blogRepository: BlogRepository,){}
  async createBlog(dto: BlogCreateDto): Promise<string> {
    const blog: BlogDocument = this.BlogModel.createInstanse(dto);
    await this.blogRepository.save(blog);
    return blog._id.toString();
  }
  async deleteBlog(id: string): Promise< true | null>{
    const blog: BlogDocument | null = await this.blogRepository.findById(id)
    if(!blog) return null
    blog.makeDeleted()
    await this.blogRepository.save(blog)
    return true
  }
  async updateBlog(id: string, body: BlogCreateDto): Promise< true | null>{
    const blog: BlogDocument | null = await this.blogRepository.findById(id)
    if(!blog) return null
    blog.updatedBlog(body)
    await this.blogRepository.save(blog)
    return true
  }
}