import { HydratedDocument, Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum Status {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike'
}

@Schema()
export class LikeStatusClass{
  @Prop({type: String, enum: [...Object.values(Status)] })
  status: string
  @Prop({type: String, required: true})
  user_id: string
  @Prop({type: String, required: true})
  comment_id: string

  constructor(user_id: string, comment_id: string, status: string) {
    this.status = status
    this.user_id = user_id
    this.comment_id = comment_id
  }
}

export const LikeStatusSchema = SchemaFactory.createForClass(LikeStatusClass)
LikeStatusSchema.loadClass(LikeStatusClass)
export type LikeStatusDocument = HydratedDocument<LikeStatusClass>
export type LikeStatusType = Model<LikeStatusDocument> & typeof LikeStatusClass