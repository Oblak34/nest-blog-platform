import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserDocument } from '../../../users/domain/user.entity';
import { BadRequestDomainException } from '../../../../../core/exception/domain-exception';
import { UserRepository } from '../../../users/infrastructure/user.repository';

export class ConfirmationUseCaseCommand {
  constructor(public code: string) {
  }
}

@CommandHandler(ConfirmationUseCaseCommand)
export class ConfirmationUseCase implements ICommandHandler<ConfirmationUseCaseCommand> {
  constructor(private userRepository: UserRepository) {
  }

  async execute(command: ConfirmationUseCaseCommand){
    const user: UserDocument | null = await this.userRepository.findByCode(command.code)
    if(!user){
      console.log('If the confirmation code is incorrect, expired or already been applied')
      throw BadRequestDomainException.create('If the confirmation code is incorrect, expired or already been applied', 'code')
    }
    if(user.emailConfirmation.isConfirmed){
      console.log('Such a user already exists')
      throw BadRequestDomainException.create('Such a user already exists', 'code')
    }

    if(user.emailConfirmation.expirationDate < new Date()){
      console.log('The link in the email has expired')
      throw BadRequestDomainException.create('The link in the email has expired', 'ExpirationDate')
    }
    user.emailConfirmation.isConfirmed = true
    await this.userRepository.save(user)
  }
}