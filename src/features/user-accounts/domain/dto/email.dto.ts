import { IsEmail } from 'class-validator';


export class EmailDto {
  @IsEmail()
  public email: string
}