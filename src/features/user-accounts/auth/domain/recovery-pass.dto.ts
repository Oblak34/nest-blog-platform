import { IsString, Length } from 'class-validator';

export class RecoveryPasswordDto {
  @Length(6, 20)
  newPassword: string
  @IsString()
  recoveryCode: string
}