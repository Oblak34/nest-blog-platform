import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthConfig {
  skipPasswordCheck: boolean
  jwtSecret: string
  expirationDate: {
    hours: number,
    minutes: number,
    seconds: number
  }

  constructor(private configService: ConfigService<any, true>) {
    this.skipPasswordCheck = this.configService.get('SKIP_PASSWORD_CHECK') === 'true'
    this.jwtSecret = this.configService.get('JWT_SECRET')
    this.expirationDate = {
      hours: this.configService.get('EXPIRATION_DATE_HOURS'),
      minutes: this.configService.get('EXPIRATION_DATE_MINUTES'),
      seconds: this.configService.get('EXPIRATION_DATE_SECONDS')
    }
  }
}