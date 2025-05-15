import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException, NotFoundDomainException } from '../../../../../core/exception/domain-exception';
import { add } from 'date-fns/add';
import {v4 as uuidv4} from "uuid";
import { UserRepository } from '../../../users/infrastructure/user.repository';
import { MailService } from '../../../../../mail/mail.service'
import { UserDocument } from '../../../users/domain/user.entity';

export class ResendingUseCaseCommand {
  constructor(public email: string) {
  }
}

@CommandHandler(ResendingUseCaseCommand)
export class ResendingUseCase implements ICommandHandler<ResendingUseCaseCommand> {
  constructor(private userRepository: UserRepository,
              private mailService: MailService) {
  }

  async execute(command: ResendingUseCaseCommand){
    const user: UserDocument | null = await this.userRepository.findByEmail(command.email)
    if(!user){
      throw BadRequestDomainException.create(`user with email ${command.email} not exist`, 'email');
    }
    if(user.emailConfirmation.isConfirmed){
      throw BadRequestDomainException.create('Such a user already exists', 'email');
    }
    const code: any = uuidv4()
    user.emailConfirmation.expirationDate = add(new Date(), { hours: 1, minutes: 3 })
    user.emailConfirmation.confirmationCode = code
    await this.userRepository.save(user);

    const updatedUser: UserDocument | null = await this.userRepository.findById(user._id.toString())
    if(!updatedUser){
      throw NotFoundDomainException.create('User not found', 'User');
    }
    this.mailService.sendUserRegistration(updatedUser.accountData.login, updatedUser.accountData.email, updatedUser.emailConfirmation.confirmationCode)
    return
  }
}