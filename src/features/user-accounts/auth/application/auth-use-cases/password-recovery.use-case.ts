import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {v4 as uuidv4} from "uuid";
import { UserDocument } from '../../../users/domain/user.entity';
import { BadRequestDomainException } from '../../../../../core/exception/domain-exception';
import { UserRepository } from '../../../users/infrastructure/user.repository';
import { MailService } from '../../../../../mail/mail.service';

export class PasswordRecoveryUseCaseCommand {
  constructor(public email: string) {
  }
}

@CommandHandler(PasswordRecoveryUseCaseCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<PasswordRecoveryUseCaseCommand> {
  constructor(private userRepository: UserRepository,
              private mailService: MailService) {
  }

  async execute(command: PasswordRecoveryUseCaseCommand){
    const user: UserDocument | null = await this.userRepository.findByEmail(command.email)
    if(!user){
      throw BadRequestDomainException.create(`User with email ${command.email} not exist`, 'User')
    }
    const recoveryCode: any = uuidv4()
    user.emailConfirmation.passwordRecoveryCode = recoveryCode
    await this.userRepository.save(user)

    await this.mailService.sendUserRecoveryCode(user.accountData.login, user.accountData.email, user.emailConfirmation.passwordRecoveryCode)
  }
}