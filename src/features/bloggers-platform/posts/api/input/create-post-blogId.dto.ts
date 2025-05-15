import { PostCreateDto } from './create-post.dto';
import { IsMongoId } from 'class-validator';

export class PostCreateAndBlogId extends PostCreateDto  {
  @IsMongoId()
  blogId: string
}
