import { UserDocument } from '../../domain/user.entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  static mapToView(user: UserDocument): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id.toString();
    dto.login = user.accountData.login;
    dto.email = user.accountData.email;
    dto.createdAt = user.accountData.createdAt;
    return dto;
  }
}
