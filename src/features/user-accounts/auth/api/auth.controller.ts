import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express'
import { CreateUserDto } from '../../users/api/input/create-user.dto';
import { EmailDto } from '../domain/email.dto';
import { CodeDto } from '../domain/code.dto';
import { RecoveryPasswordDto } from '../domain/recovery-pass.dto';
import { LocalAuthGuard } from '../../guards/decorators/local-auth.guard';
import { ExtractRefreshFromCookie, ExtractUserFromRequest } from '../../guards/decorators/param/extract-user-from-request';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { JwtAuthGuard } from '../../guards/jwt.auth-guard';
import { AuthQueryRepository } from '../infrastructure/auth.query-repository';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginUseCaseCommand } from '../application/auth-use-cases/login.use-case';
import { RegistrationUseCaseCommand } from '../application/auth-use-cases/registration.use-case';
import { ResendingUseCaseCommand } from '../application/auth-use-cases/resending.use-case';
import { ConfirmationUseCaseCommand } from '../application/auth-use-cases/confirmation.use-case';
import { PasswordRecoveryUseCaseCommand } from '../application/auth-use-cases/password-recovery.use-case';
import { NewPasswordUseCaseCommand } from '../application/auth-use-cases/new-password.use-case';
import { AuthGuardRefresh } from '../../../../core/guard/checkRefreshToken';
import { RefreshTokenUseCaseCommand } from '../application/auth-use-cases/refresh-token.use-case';
import { RefreshTokenPayloadDto } from './input/refreshTokenPayload.dto';
import { UnauthorizedDomainException } from '../../../../core/exception/domain-exception';
import { LogoutUseCaseCommand } from '../application/auth-use-cases/logout.use-case';
import { GetMeUseCaseCommand } from '../application/auth-use-cases/get-me.use-case';


@Controller('auth')
export class AuthController {
  constructor(private commandBus: CommandBus,
              private queryBus: QueryBus){}

  @UseGuards(ThrottlerGuard)
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: CreateUserDto){
    await this.commandBus.execute(new RegistrationUseCaseCommand(body))
    return
  }

  @UseGuards(ThrottlerGuard)
  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(@Body() email: EmailDto){
    await this.commandBus.execute(new ResendingUseCaseCommand(email.email))
    return
  }

  @UseGuards(ThrottlerGuard)
  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmation(@Body() code: CodeDto){
    await this.commandBus.execute(new ConfirmationUseCaseCommand(code.code))
  }

  @UseGuards(ThrottlerGuard)
  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() email: EmailDto){
    await this.commandBus.execute(new PasswordRecoveryUseCaseCommand(email.email))
  }

  @UseGuards(ThrottlerGuard)
  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() recoveryPassword: RecoveryPasswordDto){
    await this.commandBus.execute(new NewPasswordUseCaseCommand(recoveryPassword))
  }


  @UseGuards( ThrottlerGuard, LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@ExtractUserFromRequest() dto: UserContextDto, @Res({ passthrough: true }) response: Response){
    const result =  await this.commandBus.execute(new LoginUseCaseCommand(dto))
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true
    })
    return { accessToken: result.accessToken }
  }

  @UseGuards(AuthGuardRefresh)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@ExtractRefreshFromCookie() payload: RefreshTokenPayloadDto, @Res({ passthrough: true }) response: Response, ){
    const result =  await this.commandBus.execute(new RefreshTokenUseCaseCommand(payload))
    if(!result){
      throw UnauthorizedDomainException.create('No session', 'payload')
    }
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true
    })
    return { accessToken: result.accessToken }
  }

  @UseGuards(ThrottlerGuard)
  @UseGuards(AuthGuardRefresh)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@ExtractRefreshFromCookie() payload: RefreshTokenPayloadDto){
    await this.commandBus.execute(new LogoutUseCaseCommand(payload))
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@ExtractUserFromRequest() dto: UserContextDto){
    return this.queryBus.execute( new GetMeUseCaseCommand(dto.userId))
  }
}