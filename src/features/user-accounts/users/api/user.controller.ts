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
import { UserQueryRepository } from '../infrastructure/user.query-repository';
import { CreateUserDto } from './input/create-user.dto';
import { GetUsersQueryParams } from './input/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from './output/user-view.dto';
import { BasicAuthGuard } from '../../guards/basic/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserUseCaseCommand } from '../application/user-use-cases/create-user.use-case';
import { DeleteUserUseCaseCommand } from '../application/user-use-cases/delete-user.use-case';

@Controller('users')
@UseGuards(BasicAuthGuard)
export class UserController {
  constructor(
    private userQueryRepository: UserQueryRepository,
    private commandBus: CommandBus
  ) {}
  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return await this.userQueryRepository.getAll(query);
  }
  @Post()
  async createUser(@Body() body: CreateUserDto): Promise<UserViewDto | null> {
    const userId: string = await this.commandBus.execute(new CreateUserUseCaseCommand(body));
    return await this.userQueryRepository.getById(userId);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    const result = await this.commandBus.execute(new DeleteUserUseCaseCommand(id));
    if (result === null) {
      throw new NotFoundException(`user with id ${id} not exist`);
    }
    return;
  }
}
