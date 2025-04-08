import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { UserViewDto } from '../api/output/user-view.dto';
import { GetUsersQueryParams } from '../api/input/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class UserQueryRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}
  async getById(id: string): Promise<UserViewDto | null> {
    const user: UserDocument|null = await this.UserModel.findOne({ _id: id });
    if (!user) return null;
    return User.convertToView(user);
  }
  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
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
