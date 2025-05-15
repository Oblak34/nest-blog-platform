import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from './configValidationUtility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING= 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing'
}

@Injectable()
export class CoreConfig {
  @IsNumber({}, {
    message: 'Set Env variable PORT example: 5005'
  })
  port: number

@IsNotEmpty({message: 'Set Env variable MONGODB_URI, example: mongodb+srv://admin:123pass@cluster0.qhm1j.mongodb.net/nest-blogger-platform?retryWrites=true&w=majority&appName=Cluster0'})
  mongoURI: string

  @IsEnum(Environments, {
    message: 'Set correct NODE_ENV value, availble values ' + configValidationUtility.getEnumValues(Environments).join('. ')
  })
  env: string

 @IsBoolean({message : 'Set Env variable SWAGGER_ENABLED to enale/disable Swagger'})
  isSwaggerEnabled: boolean | null

 @IsBoolean({message : 'Set Env variable INCLUDE_TESTING_MODULE to enable/disable'})
  includeTestingModule: boolean | null

  constructor(private configService: ConfigService<any, true>) {
    this.port = Number(this.configService.get('PORT'))
    this.mongoURI = this.configService.get('MONGODB_URI') as string
    this.env = this.configService.get('NODE_ENV') as string
    this.isSwaggerEnabled = configValidationUtility.convertToBoolean(this.configService.get('IS_SWAGGER_ENABLED'))
    this.includeTestingModule = configValidationUtility.convertToBoolean(this.configService.get('INCLUDE_TESTING_MODULE'))

    configValidationUtility.validateConfig(this)
  }

}