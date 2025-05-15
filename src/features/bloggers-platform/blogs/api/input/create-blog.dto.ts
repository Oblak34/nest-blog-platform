import { IsNotEmpty, IsString, IsUrl, Length } from 'class-validator';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class BlogCreateDto {
  //@Transform(({ value }: TransformFnParams) =>typeof value === 'string' ? value.trim() : value,)
  @IsNotEmpty()
  @Length(1, 15)
  @IsString({ message: 'Must be a string!' })
 @Trim()
  name: string;
  @Length(1, 500)
  @IsString({ message: 'Must be a string!' })
  description: string;
  @Length(1, 100)
  @IsUrl()
  websiteUrl: string;
}