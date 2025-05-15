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
  Query, UseGuards,
} from '@nestjs/common';
import { PostCreateAndBlogId } from './input/create-post-blogId.dto';
import { PostQueryRepository } from '../infrastructure/post.query-repository';
import { GetPostsQueryParams } from './input/get-posts-query-params.input-dto';
import { CommentQueryRepository } from '../../comment/infrastructure/comment.query-repository';
import { GetCommentsQueryParams } from '../../comment/api/input/get-comments-query-params';
import { ContentDto } from './input/content.dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt.auth-guard';
import {
  ExtractUserFromRequest, ExtractUserFromRequestOrNotUser,
} from '../../../user-accounts/guards/decorators/param/extract-user-from-request';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { AuthGuardAccess } from '../../../../core/guard/checkAccessToken';
import { LikeStatusDto } from '../../comment/api/input/likeStatus.dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostUseCaseCommand } from '../application/use-cases/create-post.use-case';
import { UpdatePostUseCaseCommand } from '../application/use-cases/update-post.use-case';
import { DeletePostUseCaseCommand } from '../application/use-cases/delete-post.use-case';
import { LikeStatusPostUseCaseCommand } from '../application/use-cases/like-status-post.use-case';
import { CreateCommentUseCaseCommand } from '../../comment/application/use-cases/create-comment.use-case';

@Controller('posts')
export class PostController {
  constructor(private postQueryRepository: PostQueryRepository,
              private commentQueryRepository: CommentQueryRepository,
              private commandBus: CommandBus) {}

  @UseGuards(AuthGuardAccess)
  @Get()
  async getAllPost(@Query() query: GetPostsQueryParams, @ExtractUserFromRequestOrNotUser() user?: UserContextDto) {
    return await this.postQueryRepository.getAllPosts(query, user?.userId)
  }

  @UseGuards(AuthGuardAccess)
  @Get(':id')
  async getById(@Param('id') postId: string, @ExtractUserFromRequestOrNotUser() user?: UserContextDto) {
    const post =  await this.postQueryRepository.findById(postId, user?.userId)
    if(!post){
      throw new NotFoundException(`blog with id ${postId} not exist`)
    }
    return post
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() body: PostCreateAndBlogId) {
    const postId = await this.commandBus.execute(new CreatePostUseCaseCommand(body));
    if (postId === null) {
      throw new NotFoundException(`blog with id ${body.blogId} not exist`)
    }
    return await this.postQueryRepository.findById(postId)
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(@Param('id') id: string, @Body() body: PostCreateAndBlogId) {
    const result = await this.commandBus.execute(new UpdatePostUseCaseCommand(id, body))
    if(result === null){
      throw new NotFoundException(`post with id ${id} not exist`)
    }
    return
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string){
    const result = await this.commandBus.execute(new DeletePostUseCaseCommand(id))
    if(result === null){
      throw new NotFoundException(`post with id ${id} not exist`)
    }
    return
  }

  @UseGuards(AuthGuardAccess)
  @Get(':postId/comments')
  async getAllomments(@Param('postId') postId : string, @Query() query: GetCommentsQueryParams, @ExtractUserFromRequestOrNotUser() user?: UserContextDto){
    const result = await this.commentQueryRepository.getAllComments(query, postId, user?.userId)
    if(!result){
      throw new NotFoundException(`post with id ${postId} not exist`)
    }
    return result
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/comments')
  async createCommentByPostId(@Param('postId') PostId: string, @Body() content: ContentDto, @ExtractUserFromRequest() user: UserContextDto){
    const commentId: string = await this.commandBus.execute(new CreateCommentUseCaseCommand(content, PostId, user.userId))
    return await this.commentQueryRepository.getById(commentId)
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(@Param('postId') postId: string, @ExtractUserFromRequest() user: UserContextDto, @Body() likeStatus: LikeStatusDto){
    await this.commandBus.execute(new LikeStatusPostUseCaseCommand(postId, user.userId, likeStatus.likeStatus))
  }
}




