import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CommentDocument, CommentModelType, Comment } from '../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CommentRepository {
  constructor(@InjectModel(Comment.name) private CommentModel: CommentModelType) {}

  async create(comment) {
    const result: CommentDocument = await this.CommentModel.create(comment)
    return result._id
  }
  async getCommentById(commentId: string) {
    return await this.CommentModel.findOne({_id: commentId, deletedAt: null})
  }
  async save(instanse){
    await instanse.save()
  }
}