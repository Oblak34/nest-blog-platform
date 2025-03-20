import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { CommentQueryRepository } from './comment.query-repository';

@Controller('comments')
export class CommentController {
  constructor(private commentQueryRepository: CommentQueryRepository,) {}
  @Get(':id')
  async getCommentById(@Param('id') id: string){
    const result =  await this.commentQueryRepository.getById(id)
    if(result == null){
      throw new NotFoundException(`comment with id ${id} not exist`)
    }
  }
}