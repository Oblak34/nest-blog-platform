import { IsEmail, IsString, Length, minLength } from 'class-validator';
import { loginConstraints, passwordConstraints } from '../../domain/user.entity'

export class CreateUserDto {
  @IsString()
  login: string;
  @IsString()
  password: string;
  @IsString()
  @IsEmail()
  email: string;
}
