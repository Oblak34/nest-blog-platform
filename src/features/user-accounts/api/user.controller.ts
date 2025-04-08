import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query, UseGuards,
} from '@nestjs/common';
import { UserService } from '../application/user.service';
import { UserQueryRepository } from '../infrastructure/user.query-repository';
import { CreateUserDto } from './input/create-user.dto';
import { GetUsersQueryParams } from './input/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from './output/user-view.dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('users')
@UseGuards(BasicAuthGuard)
export class UserController {
  constructor(
    private userQueryRepository: UserQueryRepository,
    private userService: UserService,
  ) {}
  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return await this.userQueryRepository.getAll(query);
  }
  @Post()
  async createUser(@Body() body: CreateUserDto): Promise<UserViewDto | null> {
    const userId: string = await this.userService.createUser(body);
    return await this.userQueryRepository.getById(userId);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.deleteUser(id);
    if (result === null) {
      throw new NotFoundException(`user with id ${id} not exist`);
    }
    return;
  }
}
