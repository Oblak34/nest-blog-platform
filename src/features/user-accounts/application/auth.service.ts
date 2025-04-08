import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../api/input/create-user.dto';
import {
  BadRequestDomainException,
  NotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../core/exception/domain-exception';
import { add } from 'date-fns/add';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { UserRepository } from '../infrastructure/user.repository';
import { InjectModel } from '@nestjs/mongoose';
import {v4 as uuidv4} from "uuid";
import { UserService } from './user.service';
import { RecoveryPasswordDto } from '../domain/dto/recovery-pass.dto';
import bcrypt from 'bcrypt';
import { CryptoService } from './crypto.service';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { MailService } from '../../../mail/mail.service';
import * as process from 'node:process';
import { AuthConfig } from '../config/auth.config';

@Injectable()
export class AuthService {
  constructor(private userRepository: UserRepository,
              private mailService: MailService,
              private userService: UserService,
              private cryptoService: CryptoService,
              private jwtService: JwtService,
              private authConfig: AuthConfig,
              @InjectModel(User.name) private UserModel: UserModelType) {
  }
  async registerUser(dto: CreateUserDto) {
    const foundUser = await this.userRepository.findByLoginAndEmail(dto.email, dto.login)
    let fieldError;
    foundUser?.accountData.email == dto.email ? fieldError = 'email' : fieldError = 'login'
    if(foundUser){
      throw BadRequestDomainException.create('User with this email of login address exist', fieldError);
    }
    const createdUserId = await this.userService.createUser(dto)
    const user = await this.userRepository.findById(createdUserId)
    if(!user){
      throw NotFoundDomainException.create('User not found', 'User');
    }

    user.emailConfirmation.expirationDate = add(new Date(), { hours: 1, minutes: 3 })
    await this.userRepository.save(user)
    await this.mailService.sendUserRegistration(user.accountData.login, user.accountData.email, user.emailConfirmation.confirmationCode)
  }
  async resending(email: string){
    const user = await this.userRepository.findByEmail(email)
    if(!user){
      throw BadRequestDomainException.create(`user with email ${email} not exist`, 'email');
    }
    if(user.emailConfirmation.isConfirmed){
      throw BadRequestDomainException.create('Such a user already exists', 'email');
    }
    const code = uuidv4()
    user.emailConfirmation.expirationDate = add(new Date(), { hours: 1, minutes: 3 })
    user.emailConfirmation.confirmationCode = code
    await this.userRepository.save(user);

    const updatedUser = await this.userRepository.findById(user._id.toString())
    if(!updatedUser){
      throw NotFoundDomainException.create('User not found', 'User');
    }
    await this.mailService.sendUserRegistration(updatedUser.accountData.login, updatedUser.accountData.email, updatedUser.emailConfirmation.confirmationCode)
  }
  async confirmation(code: string){
    const user: UserDocument | null = await this.userRepository.findByCode(code)
    if(!user){
      throw BadRequestDomainException.create('If the confirmation code is incorrect, expired or already been applied', 'code')
    }
    if(user.emailConfirmation.isConfirmed){
      throw BadRequestDomainException.create('Such a user already exists', 'code')
    }
    if(user.emailConfirmation.expirationDate < new Date()){
      throw BadRequestDomainException.create('The link in the email has expired', 'ExpirationDate')
    }
    user.emailConfirmation.isConfirmed = true
    await this.userRepository.save(user)
  }
  async passwordRecovery(email: string){
    const user: UserDocument | null = await this.userRepository.findByEmail(email)
    if(!user){
      throw BadRequestDomainException.create(`User with email ${email} not exist`, 'User')
    }
    const recoveryCode = uuidv4()
    user.emailConfirmation.passwordRecoveryCode = recoveryCode
    await this.userRepository.save(user)

    await this.mailService.sendUserRecoveryCode(user.accountData.login, user.accountData.email, user.emailConfirmation.passwordRecoveryCode)
  }
  async newPassword(recoveryPass: RecoveryPasswordDto){
    const user = await this.userRepository.findByRecoveryCode(recoveryPass.recoveryCode)
    if(!user){
      throw BadRequestDomainException.create(`User with recovery code not exist`, 'RecoveryCode')
    }
    const salt: string = bcrypt.genSaltSync(10);
    user.accountData.hashPassword =  bcrypt.hashSync(recoveryPass.newPassword, salt);
    user.emailConfirmation.passwordRecoveryCode = null
    await this.userRepository.save(user)
  }
  async validateUser(loginOrEmail: string, password: string){
    const user = await this.userRepository.findByLoginOrEmail(loginOrEmail)
    if(!user){
      throw UnauthorizedDomainException.create('invalid login', 'login')
    }

    if(!this.authConfig.skipPasswordCheck){
      const isPasswordValid = await this.cryptoService.comparePasswords({password, hash: user.accountData.hashPassword})
      if (!isPasswordValid) {
        throw UnauthorizedDomainException.create('If the password or login or email is wrong', 'Password')
      }
    }
    return {id: user._id.toString()}
  }

  async login(userId: string){
    const accessToken = this.jwtService.sign({ id: userId } as UserContextDto)
    return {
      accessToken,
    };
  }
}