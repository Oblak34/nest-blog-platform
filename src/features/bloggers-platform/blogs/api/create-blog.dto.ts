import { IsUrl, Length } from 'class-validator';

export class BlogCreateDto {
  @Length(0, 15)
  name: string;
  @Length(0, 500)
  description: string;
  @Length(0, 100)
  @IsUrl()
  websiteUrl: string;
}