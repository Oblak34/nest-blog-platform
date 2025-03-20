import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { PostCreateAndBlogId } from '../api/create-post-blogId.dto';
import { BlogRepository } from '../../blogs/infrastructure/blog.repository';
import { BlogDocument } from '../../blogs/domain/blog.entity';
import { PostRepository } from '../infrastructure/post.repository';
import { PostCreateDto } from '../api/create-post.dto';

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              private blogRepository: BlogRepository,
              private postRepository: PostRepository){}
  async createPost(dto: PostCreateAndBlogId): Promise<string | null> {
    const blog: BlogDocument | null = await this.blogRepository.findById(dto.blogId)
    if(!blog) return null
    const post: PostDocument = await this.PostModel.createInstanse(dto, blog.name);
    await this.postRepository.save(post);
    return post._id.toString();
  }
  async update(id: string, dto: PostCreateAndBlogId): Promise<true|null>{
    const post: PostDocument | null = await this.postRepository.getById(id)
    if(!post) return null
    post.updated(dto)
    await this.postRepository.save(post)
    return true
  }
  async delete(id){
    const post: PostDocument | null = await this.postRepository.getById(id)
    if(!post) return null
    post.makeDeleted()
    await this.postRepository.save(post)
    return true
  }
  async createPostByBlogId(blogId: string, body: PostCreateDto): Promise<PostDocument | null>{
    const blog: BlogDocument | null = await this.blogRepository.findById(blogId)
    if(!blog) return null
    const dto: PostCreateAndBlogId = {
      ...body,
      blogId: blog._id.toString()
    }
    const post = await this.PostModel.createInstanse(dto, blog.name)
    await this.postRepository.save(post);
    return post
  }
}