import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { BlogDocument } from '../../blogs/domain/blog.entity';

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}
  async getById(id: string){
    return await this.PostModel.findById(id)
  }
  async save(post: PostDocument) {
    await post.save();
  }
}