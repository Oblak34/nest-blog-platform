import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailManager {
  constructor(private readonly mailService: MailerService) {}

  async sendMailRegistration(email: string, code: string) {
    const message = `this is registration via link https://some.com?code=${code}`;
    await this.mailService.sendMail({
      from: 'Admin <alyaska22@bk.ru>',
      to: email,
      subject: `Hello! This is registration!`,
      text: message,
    });
  }

  async sendMailResending(email: string, code: string) {
    const message = `Resending registration via link https://some.com?code=${code}`;

    await this.mailService.sendMail({
      from: 'Admin <alyaska22@bk.ru>',
      to: email,
      subject: `Hello! This is registration!`,
      text: message,
    });
  }

  async sendMailRecovery(email: string, code: string) {
    const message = `To restore the password, click on the link https://some.com?code=${code}`;

    await this.mailService.sendMail({
      from: 'Admin <alyaska22@bk.ru>',
      to: email,
      subject: `Hello! This is registration!`,
      text: message,
    });
  }




}