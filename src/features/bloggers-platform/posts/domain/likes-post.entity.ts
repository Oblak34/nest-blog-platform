import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export enum Status {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike'
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }})
export class Likes {
  @Prop()
  status: Status
  @Prop()
  userId: string
  @Prop()
  postId: string
  @Prop()
  login: string
  @Prop()
  createdAt: Date

  constructor(userId: string, postId: string, status: Status, login: string){
    this.status = status
    this.userId = userId
    this.postId = postId
    this.login = login
    this.createdAt = new Date()
  }
}

export const LikesSchema = SchemaFactory.createForClass(Likes);
export type LikesDocument = HydratedDocument<Likes>;
export type LikesModelType = Model<LikesDocument> & typeof Likes;