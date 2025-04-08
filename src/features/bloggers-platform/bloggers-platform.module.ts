import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { BlogController } from './blogs/api/blog.controller';
import { BlogService } from './blogs/application/blog.service';
import { BlogRepository } from './blogs/infrastructure/blog.repository';
import { BlogQueryRepository } from './blogs/infrastructure/blog.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { PostController } from './posts/api/post.controller';
import { PostService } from './posts/application/post.service';
import { PostRepository } from './posts/infrastructure/post.repository';
import { PostQueryRepository } from './posts/infrastructure/post.query-repository';
import { Post, PostSchema } from './posts/domain/post.entity';
import { Likes, LikesSchema } from './posts/domain/likes-post.entity';
import { TestController } from './testing/test.controller';
import { TestRepository } from './testing/test.repository';
import { User, UserSchema } from '../user-accounts/domain/user.entity';
import { CommentController } from './comment/comment.controller';
import { CommentQueryRepository } from './comment/comment.query-repository';
import { Comments, CommentSchema } from './comment/domain/comment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Likes.name, schema: LikesSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Comments.name, schema: CommentSchema }])
  ],
  controllers: [BlogController, PostController, TestController, CommentController],
  providers: [BlogService, BlogRepository, BlogQueryRepository, PostService, PostRepository, PostQueryRepository, TestRepository, CommentQueryRepository]
})


export class BloggersPlatformModule {}
