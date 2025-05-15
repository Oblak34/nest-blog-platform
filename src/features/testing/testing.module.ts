import { TestingController } from './test.controller';
import { Module } from '@nestjs/common';
import { TestRepository } from './test.repository';
import { BloggersPlatformModule } from '../bloggers-platform/bloggers-platform.module';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '../bloggers-platform/blogs/domain/blog.entity';
import { Post, PostSchema } from '../bloggers-platform/posts/domain/post.entity';
import { LikeStatusClass, LikeStatusSchema } from '../bloggers-platform/comment/domain/likeStatus.schema';
import { LikesPost, LikesPostSchema } from '../bloggers-platform/posts/domain/likes-post.entity';
import { User, UserSchema } from '../user-accounts/users/domain/user.entity';
import { Comment, CommentSchema } from '../bloggers-platform/comment/domain/comment.entity';
import { AuthSession, AuthSessionSchema } from '../user-accounts/sessions/domain/session.entity';

@Module({
  imports: [ MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: LikeStatusClass.name, schema: LikeStatusSchema }, {name: LikesPost.name, schema: LikesPostSchema}]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, {name: AuthSession.name, schema: AuthSessionSchema}]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    BloggersPlatformModule, UserAccountsModule],
  controllers: [TestingController],
  providers: [TestRepository],
})
export class TestingModule {}