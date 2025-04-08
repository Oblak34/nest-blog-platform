import { Module } from '@nestjs/common';
import { UserController } from './api/user.controller';
import { UserService } from './application/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from './domain/user.entity';
import { UserRepository } from './infrastructure/user.repository';
import { UserQueryRepository } from './infrastructure/user.query-repository';
import { AuthController } from './api/auth.controller';
import { EmailManager } from './mailer/email.manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './application/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './guards/local.strategy';
import { CryptoService } from './application/crypto.service';
import { MailModule } from '../../mail/module';
import { JwtStrategy } from './guards/jwt.strategy';
import { AuthQueryRepository } from './infrastructure/auth.query-repository';
import { AuthConfig } from './config/auth.config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 10000, limit: 5, },], }),
    JwtModule.registerAsync({
      imports: [ UserAccountsModule],
      inject: [AuthConfig],
      useFactory: async (authConfig: AuthConfig) => ({
        secret: authConfig.jwtSecret,
        signOptions: { expiresIn: '15m' }
      })
    }),
    PassportModule,
    MailModule,
  ],
  controllers: [UserController, AuthController],
  providers: [UserService, { provide: APP_GUARD, useClass: ThrottlerGuard},
    UserRepository, UserQueryRepository, EmailManager,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    AuthService, LocalStrategy, CryptoService, JwtStrategy, AuthQueryRepository, AuthService, AuthConfig],
  exports: [ AuthConfig, JwtStrategy ]
})
export class UserAccountsModule {}

process.env.JWT_SECRET
