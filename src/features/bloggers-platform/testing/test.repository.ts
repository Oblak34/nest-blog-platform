import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../posts/domain/post.entity';
import { Blog, BlogModelType } from '../blogs/domain/blog.entity';
import { User, UserModelType } from '../../user-accounts/domain/user.entity';
import { Likes, LikesModelType } from '../posts/domain/likes-post.entity';

@Injectable()
export class TestRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType,
              @InjectModel(Blog.name) private BlogModel: BlogModelType,
              @InjectModel(User.name) private UserModel: UserModelType,
              @InjectModel(Likes.name) private LikesModel: LikesModelType){}
  async deleteAll(){
    await this.PostModel.deleteMany()
    await this.BlogModel.deleteMany()
    await this.UserModel.deleteMany()
    await this.LikesModel.deleteMany()
  }
}