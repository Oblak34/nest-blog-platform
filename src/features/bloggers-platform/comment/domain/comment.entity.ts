
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateCommentDto } from '../create-comment.dto';

export enum Status {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike'
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }})
export class Comments {
  @Prop({ type: String, required: true })
  content: string;
  @Prop(raw({
  userId: {type: String, required: true},
  userLogin: {type: String, required: true}
  }))
  commentatorInfo: Record<string, string>;
  @Prop({ type: Date, required: true })
  createAt: Date;
@Prop(raw({
  likesCount: {type: Number, default: 0},
  dislikesCount: {type: Number, default: 0}
  }))
  likesInfo: Record<string, number>

  static createInstanse(dto: CreateCommentDto): CommentDocument {
    const comments = new this();
    comments.content = dto.content;
    comments.commentatorInfo = {}
    comments.createAt = new Date()
    comments.likesInfo = {
      likesCount: 0,
      dislikesCount: 0,
    }
    return comments as CommentDocument
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comments);
CommentSchema.loadClass(Comments);
export type CommentDocument = HydratedDocument<Comments>;
export type CommentModelType = Model<CommentDocument> & typeof Comments;