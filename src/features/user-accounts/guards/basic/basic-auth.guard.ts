import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import {UnauthorizedDomainException} from "../../../../core/exception/domain-exception";

@Injectable()
export class BasicAuthGuard implements CanActivate {
  private readonly validUsername = 'admin';
  private readonly validPassword = 'qwerty';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Basic ')){
       throw UnauthorizedDomainException.create();
    }

    const baseCredentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(baseCredentials, 'base64').toString('utf-8')

    const [username, password] = credentials.split(':');

    if(username === this.validUsername && password === this.validPassword){
        return true;
    }else{
        throw UnauthorizedDomainException.create();
    }
  }
}
