import { IsEnum } from 'class-validator';
import { Status } from '../../domain/likeStatus.schema';

export class LikeStatusDto {
  @IsEnum(Status)
  likeStatus: string
}