import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../bloggers-platform/posts/domain/post.entity';
import { Blog, BlogModelType } from '../bloggers-platform/blogs/domain/blog.entity';
import { User, UserModelType } from '../user-accounts/users/domain/user.entity';
import { LikesModelType, LikesPost } from '../bloggers-platform/posts/domain/likes-post.entity';
import { LikeStatusClass, LikeStatusType } from '../bloggers-platform/comment/domain/likeStatus.schema';
import { Comment, CommentModelType, CommentSchema } from '../bloggers-platform/comment/domain/comment.entity';
import { AuthSession, AuthSessionType } from '../user-accounts/sessions/domain/session.entity';

@Injectable()
export class TestRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              @InjectModel(Blog.name) private BlogModel: BlogModelType,
              @InjectModel(Comment.name) private CommentModel: CommentModelType,
              @InjectModel(User.name) private UserModel: UserModelType,
              @InjectModel(LikesPost.name) private LikesModel: LikesModelType,
              @InjectModel(LikeStatusClass.name) private LikesStatus: LikeStatusType,
              @InjectModel(AuthSession.name) private SessionModel: AuthSessionType
              ){}
  async deleteAll(){
    await this.PostModel.deleteMany()
    await this.BlogModel.deleteMany()
    await this.UserModel.deleteMany()
    await this.LikesModel.deleteMany()
    await this.LikesStatus.deleteMany()
    await this.CommentModel.deleteMany()
    await this.SessionModel.deleteMany()
  }
}