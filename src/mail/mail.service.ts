import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface IMailService {
  sendUserRegistration (login: string, email: string, code: string): void
  sendUserRecoveryCode(login: string, email: string, code: string | null): void
}

@Injectable()
export class MailService implements IMailService{
  constructor(protected mailerService: MailerService) {}

  async sendUserRegistration(login: string, email: string, code: string) {

    const url = `https://some.com?code=${code}`

    await this.mailerService.sendMail({
      to: email,
      subject: `Welcome to Nice App! Registration ${login}`,
      template: './registration',
      context: {
        login: login,
        url,
        code
      }
    })
  }

  async sendUserRecoveryCode(login: string, email: string, code: string | null) {
    console.log('code in aendUser  ', code)

    const url = `https://some.com?code=${code}`

    await this.mailerService.sendMail({
      to: email,
      subject: `Hello ${login}. This is recovery password`,
      template: './registration',
      context: {
        login: login,
        url,
        code
      }
    })
  }
}