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
  Query, UseGuards, ValidationPipe,
} from '@nestjs/common';
import { BlogCreateDto } from './input/create-blog.dto';
import { BlogQueryRepository } from '../infrastructure/blog.query-repository';
import { BlogViewDto } from './output/blog-view.dto';
import { GetBlogsQueryParams } from './input/get-blogs-query-params.input-dto';
import { PostCreateDto } from '../../posts/api/input/create-post.dto';
import { PostDocument } from '../../posts/domain/post.entity';
import { PostQueryRepository } from '../../posts/infrastructure/post.query-repository';
import { GetPostsQueryParams } from '../../posts/api/input/get-posts-query-params.input-dto';
import { BlogRepository } from '../infrastructure/blog.repository';
import { BlogDocument } from '../domain/blog.entity';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { AuthGuardAccess } from '../../../../core/guard/checkAccessToken';
import {
  ExtractUserFromRequestOrNotUser
} from '../../../user-accounts/guards/decorators/param/extract-user-from-request';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CreateBlogUseCaseCommand } from '../application/use-cases/create-blog.use-case';
import { DeleteBlogUseCaseCommand } from '../application/use-cases/delete-blog.use-case';
import { UpdateBlogUseCaseCommand } from '../application/use-cases/update-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostByBlogdIdUseCaseCommand } from '../../posts/application/use-cases/create-post-byBlogId.use-case';


@Controller('blogs')
export class BlogController {
  constructor( private blogRepository: BlogRepository,
               private postQueryRepository: PostQueryRepository,
               private blogQueryRepository: BlogQueryRepository,
               private commandBus: CommandBus){}

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

  @Post()
  @UseGuards(BasicAuthGuard)
  async createBlog(@Body() body: BlogCreateDto): Promise<BlogViewDto | null> {
    const blogId: string = await this.commandBus.execute(new CreateBlogUseCaseCommand(body));
    return await this.blogQueryRepository.getById(blogId);
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string){
    const result: true | null = await this.commandBus.execute(new DeleteBlogUseCaseCommand(id));
    if(result === null) {
      throw new NotFoundException(`blog with id ${id} not exist`)
    }
    return;
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updateBlog(@Param('id') id: string, @Body() body: BlogCreateDto){
    const result: true | null = await this.commandBus.execute(new UpdateBlogUseCaseCommand(id, body))
    if(result === null) {
      throw new NotFoundException(`blog with id ${id} not exist`)
    }
    return;
  }
  @Post(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  async createPostByBlogId(@Param('blogId') blogId: string, @Body() body: PostCreateDto){
    const post: PostDocument | null = await this.commandBus.execute(new CreatePostByBlogdIdUseCaseCommand(blogId, body))
    if(post === null){
      throw new NotFoundException(`blog with id ${blogId} not exist`)
    }
    return this.postQueryRepository.findById(post._id.toString())
  }

  @UseGuards(AuthGuardAccess)
  @Get(':blogId/posts')
  async getAllPostsByBlogId(@Param('blogId') blogId: string, @Query() query: GetPostsQueryParams, @ExtractUserFromRequestOrNotUser() user?: UserContextDto){
    const blog: BlogDocument | null = await this.blogRepository.findById(blogId)
    if(!blog) {
      throw new NotFoundException(`blog with id ${blogId} not exist`)
    }
    const posts =  await this.postQueryRepository.getAllPostsByBlogId(query, blogId, user?.userId)
    if(posts === null){
      throw new NotFoundException(`post with id ${blogId} not exist`)
    }
    return posts
  }
}