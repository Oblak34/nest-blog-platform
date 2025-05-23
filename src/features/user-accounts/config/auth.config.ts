import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { configValidationUtility } from '../../../core/config/configValidationUtility';
import { Type } from 'class-transformer';


@Injectable()
export class AuthConfig {

  @IsBoolean({ message: 'Set ENV variable skipPasswordCheck is boolean' })
  skipPasswordCheck: boolean

  @IsString()
  @IsNotEmpty({message: 'set env variable jwt secret'})
  jwtSecret: string

  expirationDate: {
    hours: number,
    minutes: number,
    seconds: number
  }

  expiresInAccessToken: string
  expiresInRefreshToken: string

  @IsBoolean({ message: 'Set ENV variable userConfirmed is boolean' })
  userConfirmed: boolean | null

  constructor(private configService: ConfigService<any, true>) {
    this.skipPasswordCheck = this.configService.get('SKIP_PASSWORD_CHECK') === 'true'
    this.jwtSecret = this.configService.get('JWT_SECRET')
    this.expirationDate = {
      hours: Number(this.configService.get('EXPIRATION_DATE_HOURS')),
      minutes: Number(this.configService.get('EXPIRATION_DATE_MINUTES')),
      seconds: Number(this.configService.get('EXPIRATION_DATE_SECONDS'))
    }
    this.expiresInAccessToken = this.configService.get('ACCESS_TOKEN_EXPIRES_IN')
    this.expiresInRefreshToken = this.configService.get('REFRESH_TOKEN_EXPIRES_IN')
    this.userConfirmed = configValidationUtility.convertToBoolean(this.configService.get('USER_CONFIRMED'))
  }
}