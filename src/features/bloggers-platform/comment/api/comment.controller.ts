import {
  Body,
  Controller, Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentQueryRepository } from '../infrastructure/comment.query-repository';
import { ContentDto } from '../../posts/api/input/content.dto';
import { JwtAuthGuard } from '../../../user-accounts/guards/jwt.auth-guard';
import {
  ExtractUserFromRequest,
  ExtractUserFromRequestOrNotUser,
} from '../../../user-accounts/guards/decorators/param/extract-user-from-request';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { LikeStatusDto } from './input/likeStatus.dto';
import { AuthGuardAccess } from '../../../../core/guard/checkAccessToken';
import { SkipThrottle } from '@nestjs/throttler';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateCommentUseCaseCommand } from '../application/use-cases/update-comment.use-case';
import { DeleteCommentUseCaseCommand } from '../application/use-cases/delete-comment.use-case';
import { LikeStatusCommentUseCaseCommand } from '../application/use-cases/like-status-comment.use-case';

@SkipThrottle()
@Controller('comments')
export class CommentController {
  constructor(private commentQueryRepository: CommentQueryRepository,
              private commandBus: CommandBus) {}



  @UseGuards(AuthGuardAccess)
  @Get(':id')
  async getCommentById(@Param('id') id: string, @ExtractUserFromRequestOrNotUser() user?: UserContextDto){
    const result =  await this.commentQueryRepository.getById(id, user?.userId)
    if(result == null){
      throw new NotFoundException(`comment with id ${id} not exist`)
    }
    return result
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(@Param('commentId') commentId: string, @Body() dto: ContentDto, @ExtractUserFromRequest() user: UserContextDto){
     await this.commandBus.execute(new UpdateCommentUseCaseCommand(commentId, dto.content, user.userId))
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Param('commentId') commentId: string,  @ExtractUserFromRequest() user: UserContextDto){
    await this.commandBus.execute(new DeleteCommentUseCaseCommand(commentId, user.userId))
  }


  @UseGuards(JwtAuthGuard)
  @Put(':commentId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(@Param('commentId') commentId: string, @ExtractUserFromRequest() user: UserContextDto, @Body() likeStatus: LikeStatusDto){
     await this.commandBus.execute(new LikeStatusCommentUseCaseCommand(commentId, user.userId, likeStatus.likeStatus))
  }
}