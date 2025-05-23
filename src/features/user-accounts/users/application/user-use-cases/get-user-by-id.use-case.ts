import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';

export class GetUserByIdUseCaseCommand {
  constructor(public userId: string) {
  }
}

@QueryHandler(GetUserByIdUseCaseCommand)
export class GetUserByIdUseCase implements IQueryHandler<GetUserByIdUseCaseCommand> {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {
  }

  async execute(command: GetUserByIdUseCaseCommand){
    const user: UserDocument|null = await this.UserModel.findOne({ _id: command.userId });
    if (!user) return null;
    return User.convertToView(user);
  }
}
