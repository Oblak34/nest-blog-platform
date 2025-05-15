import { Module } from '@nestjs/common';
import { UserController } from './users/api/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from './users/domain/user.entity';
import { UserRepository } from './users/infrastructure/user.repository';
import { UserQueryRepository } from './users/infrastructure/user.query-repository';
import { AuthController } from './auth/api/auth.controller';
import { EmailManager } from './mailer/email.manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './guards/local.strategy';
import { CryptoService } from './crypto.service';
import { MailModule } from '../../mail/module';
import { JwtStrategy } from './guards/jwt.strategy';
import { AuthQueryRepository } from './auth/infrastructure/auth.query-repository';
import { AuthConfig } from './config/auth.config';
import { CreateUserUseCase } from './users/application/user-use-cases/create-user.use-case';
import { DeleteUserUseCase } from './users/application/user-use-cases/delete-user.use-case';
import { LoginUseCase } from './auth/application/auth-use-cases/login.use-case';
import { CqrsModule } from '@nestjs/cqrs';
import { RegistrationUseCase } from './auth/application/auth-use-cases/registration.use-case';
import { ResendingUseCase } from './auth/application/auth-use-cases/resending.use-case';
import { ConfirmationUseCase } from './auth/application/auth-use-cases/confirmation.use-case';
import { PasswordRecoveryUseCase } from './auth/application/auth-use-cases/password-recovery.use-case';
import { NewPasswordUseCase } from './auth/application/auth-use-cases/new-password.use-case';
import { ValidateUserUseCase } from './auth/application/auth-use-cases/validate-user.use-case';
import { AuthSession, AuthSessionSchema } from './sessions/domain/session.entity';
import { RefreshTokenUseCase } from './auth/application/auth-use-cases/refresh-token.use-case';
import { LogoutUseCase } from './auth/application/auth-use-cases/logout.use-case';
import { GetAllDevicesUseCase } from './sessions/application/use-cases/get-all-devices.use-case';
import { SessionController } from './sessions/api/session.controller';
import { DeleteAllDevicesUseCase } from './sessions/application/use-cases/delete-all-devices.use-case';
import { DeleteDeviceByIdUseCase } from './sessions/application/use-cases/delete-device-by-id.use-case';

const useCases = [
  CreateUserUseCase,
  DeleteUserUseCase,
  LoginUseCase,
  RegistrationUseCase,
  ResendingUseCase,
  ConfirmationUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
  ValidateUserUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  GetAllDevicesUseCase,
  DeleteAllDevicesUseCase,
  DeleteDeviceByIdUseCase
]

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, {name: AuthSession.name, schema: AuthSessionSchema}]),
    ThrottlerModule.forRoot([{ ttl: 10000, limit: 5, },],),
    JwtModule.registerAsync({
      imports: [ UserAccountsModule],
      inject: [AuthConfig],
      useFactory: async (authConfig: AuthConfig) => ({
        secret: authConfig.jwtSecret,
        signOptions: { expiresIn: authConfig.expiresIn }
      })
    }),
    PassportModule,
    MailModule
  ],
  controllers: [UserController, AuthController, SessionController],
  providers: [
    ...useCases,
    UserRepository,
    UserQueryRepository,
    EmailManager,
    LocalStrategy,
    CryptoService,
    JwtStrategy,
    AuthQueryRepository,
    AuthConfig,
  ],
  exports: [ AuthConfig, JwtStrategy ]
})
export class UserAccountsModule {}

