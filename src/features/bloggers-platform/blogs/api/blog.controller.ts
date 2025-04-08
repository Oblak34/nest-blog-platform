import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post, Put,
  Query,
} from '@nestjs/common';
import { BlogCreateDto } from './create-blog.dto';
import { BlogService } from '../application/blog.service';
import { BlogQueryRepository } from '../infrastructure/blog.query-repository';
import { BlogViewDto } from './blog-view.dto';
import { GetBlogsQueryParams } from './get-blogs-query-params.input-dto';
import { PostService } from '../../posts/application/post.service';
import { PostCreateDto } from '../../posts/api/create-post.dto';
import { PostDocument } from '../../posts/domain/post.entity';
import { PostQueryRepository } from '../../posts/infrastructure/post.query-repository';
import { GetPostsQueryParams } from '../../posts/api/get-posts-query-params.input-dto';
import { BlogRepository } from '../infrastructure/blog.repository';
import { BlogDocument } from '../domain/blog.entity';
import { Throttle } from '@nestjs/throttler';

@Controller('blogs')
export class BlogController {
  constructor( private blogService: BlogService,
               private postService: PostService,
               private blogRepository: BlogRepository,
               private postQueryRepository: PostQueryRepository,
               private blogQueryRepository: BlogQueryRepository,){}

  @Get()
  async getAllBlogs(@Query() query: GetBlogsQueryParams){
    return await this.blogQueryRepository.getAllBlogs(query)
  }
  @Get(':id')
  async getBlogById(@Param('id') id: string):Promise<BlogViewDto | null> {
    const blog: BlogViewDto | null = await this.blogQueryRepository.getById(id)
    if(!blog){
      throw new NotFoundException(`blog with id ${id} not exist`)
    }
    return blog
  }
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @Post()
  async createBlog(@Body() body: BlogCreateDto): Promise<BlogViewDto | null> {
    const blogId: string = await this.blogService.createBlog(body);
    return await this.blogQueryRepository.getById(blogId);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string){
    const result: true | null = await this.blogService.deleteBlog(id);
    if(result === null) {
      throw new NotFoundException(`blog with id ${id} not exist`)
    }
    return;
  }
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(@Param('id') id: string, @Body() body: BlogCreateDto){
    const result: true | null = await this.blogService.updateBlog(id, body)
    if(result === null) {
      throw new NotFoundException(`blog with id ${id} not exist`)
    }
    return;
  }
  @Post(':blogId/posts')
  async createPostByBlogId(@Param('blogId') blogId: string, @Body() body: PostCreateDto){
    const post: PostDocument | null = await this.postService.createPostByBlogId(blogId, body)
    if(post === null){
      throw new NotFoundException(`blog with id ${blogId} not exist`)
    }
    return this.postQueryRepository.findById(post._id.toString())
  }
  @Get(':blogId/posts')
  async getAllPostsByBlogId(@Param('blogId') blogId: string, @Query() query: GetPostsQueryParams){
    const blog: BlogDocument | null = await this.blogRepository.findById(blogId)
    if(!blog) {
      throw new NotFoundException(`blog with id ${blogId} not exist`)
    }
    const posts =  await this.postQueryRepository.getAllPostsByBlogId(query, blogId)
    if(posts === null){
      throw new NotFoundException(`post with id ${blogId} not exist`)
    }
    return posts
  }
}