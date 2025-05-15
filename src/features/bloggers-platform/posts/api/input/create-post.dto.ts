import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class PostCreateDto {
  @Trim()
  @IsString({ message: 'Title should be max 15 characters long' })
  @Length(1, 30)
  title: string
  @Trim()
  @IsString()
  @Length(1, 100)
  shortDescription: string
  @Trim()
  @IsString()
  @Length(1, 1000)
  content: string
}