import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { PostLikesDto } from '../api/input/post-likes.dto';

export enum Status {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike'
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }})
export class LikesPost {
  @Prop({type: String, enum: [...Object.values(Status)] })
  status: string
  @Prop({type: String, required: true})
  userId: string
  @Prop({type: String, required: true})
  postId: string
  @Prop({type: String, required: true})
  login: string
  @Prop({type: String, required: true})
  createdAt: string

  constructor(dto: PostLikesDto){
    this.status = dto.status
    this.userId = dto.userId
    this.postId = dto.postId
    this.login = dto.login
    this.createdAt = new Date().toISOString()
  }
}

export const LikesPostSchema = SchemaFactory.createForClass(LikesPost);
export type LikePostDocument = HydratedDocument<LikesPost>;
export type LikesModelType = Model<LikePostDocument> & typeof LikesPost;