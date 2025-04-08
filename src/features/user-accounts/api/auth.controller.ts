import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request } from '@nestjs/common';
import { CreateUserDto } from './input/create-user.dto';
import { AuthService } from '../application/auth.service';
import { EmailDto } from '../domain/dto/email.dto';
import { CodeDto } from '../domain/dto/code.dto';
import { RecoveryPasswordDto } from '../domain/dto/recovery-pass.dto';
import { LocalAuthGuard } from '../guards/decorators/local-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { JwtAuthGuard } from '../guards/jwt.auth-guard';
import { AuthQueryRepository } from '../infrastructure/auth.query-repository';
import { ThrottlerGuard } from '@nestjs/throttler';


@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,
              private authQueryRepository: AuthQueryRepository){}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: CreateUserDto){
    await this.authService.registerUser(body)
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(@Body() email: EmailDto){
    await this.authService.resending(email.email)
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmation(@Body() code: CodeDto){
    await this.authService.confirmation(code.code)
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() email: EmailDto){
    await this.authService.passwordRecovery(email.email)
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() recoveryPassword: RecoveryPasswordDto){
    await this.authService.newPassword(recoveryPassword)
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@ExtractUserFromRequest() user: UserContextDto){
    return this.authService.login(user.id)
  }


  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@ExtractUserFromRequest() user: UserContextDto){
    return this.authQueryRepository.getMe(user.id)
  }
}