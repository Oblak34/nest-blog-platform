import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RecoveryPasswordDto } from '../../domain/recovery-pass.dto';
import { UserDocument } from '../../../users/domain/user.entity';
import { BadRequestDomainException } from '../../../../../core/exception/domain-exception';
import bcrypt from 'bcrypt';
import { UserRepository } from '../../../users/infrastructure/user.repository';

export class NewPasswordUseCaseCommand {
  constructor(public recoveryPass: RecoveryPasswordDto) {
  }
}

@CommandHandler(NewPasswordUseCaseCommand)
export class NewPasswordUseCase implements ICommandHandler<NewPasswordUseCaseCommand> {
  constructor(private userRepository: UserRepository) {
  }

  async execute(command: NewPasswordUseCaseCommand){
    const user: UserDocument | null = await this.userRepository.findByRecoveryCode(command.recoveryPass.recoveryCode)
    if(!user){
      throw BadRequestDomainException.create(`User with recovery code not exist`, 'RecoveryCode')
    }
    const salt: string = bcrypt.genSaltSync(10);
    user.accountData.hashPassword =  bcrypt.hashSync(command.recoveryPass.newPassword, salt);
    user.emailConfirmation.passwordRecoveryCode = null
    await this.userRepository.save(user)
  }
}
