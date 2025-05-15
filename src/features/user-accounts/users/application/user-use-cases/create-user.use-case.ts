import { CreateUserDto } from '../../api/input/create-user.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { ExpDate } from '../../../auth/domain/expDate';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UserRepository } from '../../infrastructure/user.repository';
import { AuthConfig } from '../../../config/auth.config';

export class CreateUserUseCaseCommand {
  constructor(public dto: CreateUserDto) {
  }
}

@CommandHandler(CreateUserUseCaseCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserUseCaseCommand>{
  constructor(@InjectModel(User.name) private UserModel: UserModelType,
              private userRepository: UserRepository,
              private authConfig: AuthConfig,){}

  async execute(command: CreateUserUseCaseCommand) {
    const confirmCode = crypto.randomUUID()

    const expDate: ExpDate = this.authConfig.expirationDate

    const user =  new User(command.dto, confirmCode, expDate)
    const newUser: UserDocument =  await this.UserModel.create(user)
    newUser.emailConfirmation.isConfirmed = this.authConfig.userConfirmed
    await this.userRepository.save(newUser);
    return newUser._id.toString();
  }
}
