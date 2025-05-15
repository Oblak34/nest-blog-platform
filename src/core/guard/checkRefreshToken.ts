import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express'
import { UnauthorizedDomainException } from '../exception/domain-exception';
import { InjectModel } from '@nestjs/mongoose';
import {
  AuthSession,
  AuthSessionType,
  SessionDocument,
} from '../../features/user-accounts/sessions/domain/session.entity';

@Injectable()
export class AuthGuardRefresh implements CanActivate {
  constructor(private jwtService: JwtService,
              @InjectModel(AuthSession.name) private authSessionModel: AuthSessionType) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();


   /////////////////////// проверяем если токен ///////////////////////
    if(!request.cookies){
      throw UnauthorizedDomainException.create('no cookie', 'cookie')
    }
    const refreshToken = request.cookies.refreshToken
    try {

      ////////////////// расчехляем токен и достаем данные //////////////////
      const payload = await this.jwtService.verify( refreshToken, { secret: 'jwt-secret' });


      /////////////////// ищем открытую сессию этого токена  /////////////////////
      const session: SessionDocument | null = await this.authSessionModel.findOne({ device_id: payload.deviceId})
      /////////////////// если нет сессии ошибка, нужно логиниться ////////////////
      if(!session){
        throw  UnauthorizedDomainException.create('refresh token expire', 'refresh token')
      }

      ////////// если есть открытая сессия сравниваем версию токена и сессии по IAT дате ////////
      const payloadIat = new Date(payload.iat * 1000).toISOString()

      ////////// если токен не от этой сессии то ошибка нужно залогиниться /////////////

      if( session.iat !== payloadIat){
        throw UnauthorizedDomainException.create('refresh token invalid', 'refresh token')
      }

      /////////// если от этой то записываем payload в request и пропускаем //////////////
      request['payload'] = payload;
    }catch(e){
      throw UnauthorizedDomainException.create('refreshToken expire!!!', 'refreshtoken')
    }

    return true;
  }
}