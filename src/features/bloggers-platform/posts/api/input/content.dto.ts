import { IsString, Length } from 'class-validator';

export class ContentDto {
  @IsString()
  @Length(20, 300)
  content: string
}