
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateNewCommentDto } from '../api/input/create-new-comment.dto';

export enum Status {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike'
}

@Schema({ timestamps: { updatedAt: 'updatedAt' }})
export class Comment {
  @Prop({ type: String, required: true })
  content: string;
  @Prop(raw({
  userId: {type: String, required: true},
  userLogin: {type: String, required: true}
  }))
  commentatorInfo: Record<string, string>;
  @Prop({ type: Date, required: true })
  createdAt: string;
  @Prop(raw({
  likesCount: {type: Number, default: 0},
  dislikesCount: {type: Number, default: 0},
  }))
  likesInfo: Record<string, number>
  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date
  @Prop( {type: String, required: true})
  postId: string

  constructor( dto: CreateNewCommentDto){
    this.content = dto.content
    this.commentatorInfo = { userId: dto.userId, userLogin: dto.loginUser }
    this.createdAt = new Date().toISOString()
    this.postId = dto.postId
    this.likesInfo = {
      likesCount: 0,
      dislikesCount: 0
    }
  }
}
export type CommentDocument = HydratedDocument<Comment>;
export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);
export type CommentModelType = Model<CommentDocument> & typeof Comment;