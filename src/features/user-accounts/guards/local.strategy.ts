import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UnauthorizedDomainException } from '../../../core/exception/domain-exception';
import { CommandBus } from '@nestjs/cqrs';
import { ValidateUserUseCaseCommand } from '../auth/application/auth-use-cases/validate-user.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
  constructor(private commandBus: CommandBus) {
    super({ usernameField: 'loginOrEmail'});
  }

  async validate(loginOrEmail: string, password: string){
    const user: any = await this.commandBus.execute(new ValidateUserUseCaseCommand(loginOrEmail, password))
    if(!user){
      throw UnauthorizedDomainException.create('User nit exsist', 'LocalStrategy')
    }
    return user
  }
}