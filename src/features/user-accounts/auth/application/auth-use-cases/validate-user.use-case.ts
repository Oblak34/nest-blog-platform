import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedDomainException } from '../../../../../core/exception/domain-exception';
import { UserRepository } from '../../../users/infrastructure/user.repository';
import { CryptoService } from '../../../crypto.service';
import { AuthConfig } from '../../../config/auth.config';
import { UserDocument } from '../../../users/domain/user.entity';

export class ValidateUserUseCaseCommand {
  constructor(public loginOrEmail: string, public password: string) {
  }
}

@CommandHandler(ValidateUserUseCaseCommand)
export class ValidateUserUseCase implements ICommandHandler<ValidateUserUseCaseCommand> {
  constructor(private userRepository: UserRepository,
              private cryptoService: CryptoService,
              private authConfig: AuthConfig) {
  }

  async execute(command: ValidateUserUseCaseCommand){
    const {loginOrEmail, password} = command

    const user: UserDocument | null = await this.userRepository.findByLoginOrEmail(loginOrEmail)
    if(!user){
      throw UnauthorizedDomainException.create('invalid login', 'login')
    }
    if(!this.authConfig.skipPasswordCheck){
      const isPasswordValid: boolean = await this.cryptoService.comparePasswords({password, hash: user.accountData.hashPassword})
      if (!isPasswordValid) {
        throw UnauthorizedDomainException.create('If the password or login or email is wrong', 'Password')
      }
    }
    return {id: user._id.toString()}
  }
}
