import { Module } from '@nestjs/common';
import { BlogController } from './blogs/api/blog.controller';
import { BlogRepository } from './blogs/infrastructure/blog.repository';
import { BlogQueryRepository } from './blogs/infrastructure/blog.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { PostController } from './posts/api/post.controller';
import { PostRepository } from './posts/infrastructure/post.repository';
import { PostQueryRepository } from './posts/infrastructure/post.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { LikesPost, LikesPostSchema } from './posts/domain/likes-post.entity';
import { TestRepository } from '../testing/test.repository';
import { User, UserSchema } from '../user-accounts/users/domain/user.entity';
import { CommentController } from './comment/api/comment.controller';
import { CommentQueryRepository } from './comment/infrastructure/comment.query-repository';
import { Comment, CommentSchema } from './comment/domain/comment.entity';
import { CommentRepository } from './comment/infrastructure/comment.repository';
import { UserRepository } from '../user-accounts/users/infrastructure/user.repository';
import { LikeStatusClass, LikeStatusSchema } from './comment/domain/likeStatus.schema';
import { JwtService } from '@nestjs/jwt';
import { TestingController } from '../testing/test.controller';
import { CreateBlogUseCase } from './blogs/application/use-cases/create-blog.use-case';
import { DeleteBlogUseCase } from './blogs/application/use-cases/delete-blog.use-case';
import { UpdateBlogUseCase } from './blogs/application/use-cases/update-blog.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { CreatePostUseCase } from './posts/application/use-cases/create-post.use-case';
import { UpdatePostUseCase } from './posts/application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './posts/application/use-cases/delete-post.use-case';
import { CreatePostByBlogIdUseCase } from './posts/application/use-cases/create-post-byBlogId.use-case';
import { LikeStatusPostUseCase } from './posts/application/use-cases/like-status-post.use-case';
import { CreateCommentUseCase } from './comment/application/use-cases/create-comment.use-case';
import { UpdateCommentUseCase } from './comment/application/use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './comment/application/use-cases/delete-comment.use-case';
import { LikeStatusCommentUseCase } from './comment/application/use-cases/like-status-comment.use-case';
import { AuthSession, AuthSessionSchema } from '../user-accounts/sessions/domain/session.entity';
import { GetAllBlogsUseCase } from './blogs/application/use-cases/get-all-blogs.use-case';
import { GetBlogByIdUseCase } from './blogs/application/use-cases/get-blog-by-id.use-case';
import { GetCommentByIdUseCase } from './comment/application/use-cases/get-comment-by-id.use-case';
import { GetCommentsUseCase } from './comment/application/use-cases/get-comments.use-case';
import { GetPostByIdUseCase } from './posts/application/use-cases/get-post-by-id.use-case';
import { GetAllPostsUseCase } from './posts/application/use-cases/get-posts.use-case';
import { GetPostsByBlogIdUseCase } from './posts/application/use-cases/get-all-posts-by-blogId.use-case';

const useCases = [
  CreateBlogUseCase,
  DeleteBlogUseCase,
  UpdateBlogUseCase,
  GetAllBlogsUseCase,
  GetBlogByIdUseCase,
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  CreatePostByBlogIdUseCase,
  GetPostByIdUseCase,
  GetAllPostsUseCase,
  GetPostsByBlogIdUseCase,
  LikeStatusPostUseCase,
  CreateCommentUseCase,
  GetCommentByIdUseCase,
  GetCommentsUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
  LikeStatusCommentUseCase
]

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: LikeStatusClass.name, schema: LikeStatusSchema }, {name: LikesPost.name, schema: LikesPostSchema}]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, {name: AuthSession.name, schema: AuthSessionSchema}]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }])
  ],
  controllers: [BlogController, PostController, TestingController, CommentController],
  providers: [BlogRepository,
    BlogQueryRepository,
    PostRepository,
    PostQueryRepository,
    TestRepository,
    CommentQueryRepository,
    CommentRepository,
    UserRepository, JwtService,
    ...useCases]
})


export class BloggersPlatformModule {}
