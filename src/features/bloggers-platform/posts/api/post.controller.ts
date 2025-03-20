import {
  Body,
  Controller, Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostCreateAndBlogId } from './create-post-blogId.dto';
import { PostService } from '../application/post.service';
import { PostQueryRepository } from '../infrastructure/post.query-repository';
import { GetPostsQueryParams } from './get-posts-query-params.input-dto';
import { CommentQueryRepository } from '../../comment/comment.query-repository';
import { GetCommentsQueryParams } from '../../comment/get-comments-query-params';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService,
              private postQueryRepository: PostQueryRepository,
              private commentQueryRepository: CommentQueryRepository,) {}
  @Get()
  async getAllPost(@Query() query: GetPostsQueryParams) {
    return await this.postQueryRepository.getAllPosts(query)
  }
  @Get(':id')
  async getById(@Param('id') id: string) {
    const post =  await this.postQueryRepository.findById(id)
    if(!post){
      throw new NotFoundException(`blog with id ${id} not exist`)
    }
    return post
  }
  @Post()
  async createPost(@Body() body: PostCreateAndBlogId) {
    const postId = await this.postService.createPost(body);
    if (postId === null) {
      throw new NotFoundException(`blog with id ${body.blogId} not exist`)
    }
    return await this.postQueryRepository.findById(postId)
  }
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(@Param('id') id: string, @Body() body: PostCreateAndBlogId) {
    const result = await this.postService.update(id, body)
    if(result === null){
      throw new NotFoundException(`post with id ${id} not exist`)
    }
    return
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string){
    const result: true|null = await this.postService.delete(id)
    if(result === null){
      throw new NotFoundException(`post with id ${id} not exist`)
    }
    return
  }
  @Get(':postId/comments')
  async getAllomments(@Param('postId') postId : string, @Query() query: GetCommentsQueryParams){
    const result = await this.commentQueryRepository.getAllComments(query, postId)
    if(!result){
      throw new NotFoundException(`post with id ${postId} not exist`)
    }
    return
  }
}




