import { GetUsersQueryParams } from '../../api/input/get-users-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domain/user.entity';
import { FilterQuery } from 'mongoose';
import { UserViewDto } from '../../api/output/user-view.dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

export class GetAllUsersUseCaseCommand {
  constructor(public query: GetUsersQueryParams) {
  }
}

@QueryHandler(GetAllUsersUseCaseCommand)
export class GetAllUsersUseCase implements IQueryHandler<GetAllUsersUseCaseCommand>{
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {
  }

  async execute(command: GetAllUsersUseCaseCommand){
    const { query } = command
    const filter: FilterQuery<User> = {
      deletedAt: null,
    };

    if (query.searchLoginTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        'accountData.login': { $regex: query.searchLoginTerm ?? '', $options: 'i' },
      });
    }
    if (query.searchEmailTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        'accountData.email': { $regex: query.searchEmailTerm ?? '', $options: 'i' },
      });
    }

    const users = await this.UserModel.find(filter)
      .sort({ [`accountData.${query.sortBy}`]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount: number = await this.UserModel.countDocuments(filter);

    const items: UserViewDto[] = users.map(UserViewDto.mapToView);
    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}