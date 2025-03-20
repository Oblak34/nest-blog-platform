import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentModelType, Comments } from './domain/comment.entity';

@Injectable()
export class CommentQueryRepository {
  constructor(@InjectModel(Comments.name) private CommentModel: CommentModelType) {}
  async getAllComments(query, postId: string, userId?: string) {
    const comments = await this.CommentModel.find({ postId: postId })
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)

    if (comments.length < 1) {
      return null
    }
    const totalCount: number = await this.CommentModel.countDocuments({ postId: postId });

  }
  async getById(id: string){
    await this.CommentModel.findById(id)
  }
}