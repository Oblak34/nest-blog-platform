import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { PostCreateAndBlogId } from '../api/input/create-post-blogId.dto';
import { NotFoundException } from '@nestjs/common';

export enum Status {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike'
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }})
export class Post {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDecription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string | null;

  @Prop(raw({
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number,  default: 0 },
  }))
  extendedLikesInfo: Record<string, number>

  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  updated(dto: PostCreateAndBlogId){
    this.title = dto.title
    this.shortDecription = dto.shortDescription
    this.content = dto.content
    this.blogId = dto.blogId
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      //throw new Error('User not found');
      throw new NotFoundException(`post not exist`)
    }
    this.deletedAt = new Date();
  }

  static createInstanse(dto: PostCreateAndBlogId, blogName: string): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.shortDecription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = blogName;
    post.createdAt = new Date()
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
    }
    return post as PostDocument
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.loadClass(Post);
export type PostDocument = HydratedDocument<Post>;
export type PostModelType = Model<PostDocument> & typeof Post;