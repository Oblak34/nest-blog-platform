import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../application/auth.service';
import { UnauthorizedDomainException } from '../../../core/exception/domain-exception';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){
  constructor(private authService: AuthService) {
    super({ usernameField: 'loginOrEmail'});
  }

  async validate(loginOrEmail: string, password: string){
    const user = await this.authService.validateUser(loginOrEmail, password)
    if(!user){
      throw UnauthorizedDomainException.create('User nit exsist', 'LocalStrategy')
    }
    return user
  }
}