import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BlogCreateDto } from '../api/create-blog.dto';
import { BlogViewDto } from '../api/blog-view.dto';
import { HydratedDocument, Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Blog {
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: String, required: true })
  description: string;
  @Prop({ type: String, required: true })
  websiteUrl: string;
  @Prop({ type: Boolean, required: true, default: false })
  isMembership: boolean;
  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  makeDeleted() {
    if (this.deletedAt !== null) {
      //throw new Error('User not found');
      throw new NotFoundException(`post not exist`)
    }
    this.deletedAt = new Date();
  }
  updatedBlog(dto: BlogCreateDto){
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl
    this.updatedAt = new Date()
  }

  static createInstanse(dto: BlogCreateDto): BlogDocument {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership;
    return blog as BlogDocument
  }

  static convertToView(blog: BlogDocument): BlogViewDto {
    return {
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership
    }
  }
}
  export const BlogSchema = SchemaFactory.createForClass(Blog);
  BlogSchema.loadClass(Blog);
  export type BlogDocument = HydratedDocument<Blog>;
  export type BlogModelType = Model<BlogDocument> & typeof Blog;


