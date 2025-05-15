import { CreateUserDto } from '../../../users/api/input/create-user.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserDocument } from '../../../users/domain/user.entity';
import { BadRequestDomainException, NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { CreateUserUseCaseCommand } from '../../../users/application/user-use-cases/create-user.use-case';
import { add } from 'date-fns/add';
import { UserRepository } from '../../../users/infrastructure/user.repository';
import { MailService } from '../../../../../mail/mail.service';
import { AuthConfig } from '../../../config/auth.config';

export class RegistrationUseCaseCommand {
  constructor(public dto: CreateUserDto) {
  }
}

@CommandHandler(RegistrationUseCaseCommand)
export class RegistrationUseCase implements ICommandHandler<RegistrationUseCaseCommand> {
  constructor(private userRepository: UserRepository,
              private mailService: MailService,
              private authConfig: AuthConfig,
              private commandBus: CommandBus) {
  }

  async execute(command: RegistrationUseCaseCommand) {
    const foundUser: UserDocument | null = await this.userRepository.findByLoginAndEmail(command.dto.email, command.dto.login)
    let fieldError;
    foundUser?.accountData.email == command.dto.email ? fieldError = 'email' : fieldError = 'login'
    if(foundUser){
      throw BadRequestDomainException.create('User with this email of login address exist', fieldError);
    }
    const createdUserId = await this.commandBus.execute(new CreateUserUseCaseCommand(command.dto))
    const user: UserDocument | null = await this.userRepository.findById(createdUserId)
    if(!user){
      throw NotFoundDomainException.create('User not found', 'User');
    }

    user.emailConfirmation.expirationDate = add(new Date(), this.authConfig.expirationDate)
    await this.userRepository.save(user)
    this.mailService.sendUserRegistration(user.accountData.login, user.accountData.email, user.emailConfirmation.confirmationCode)
    return
  }

}