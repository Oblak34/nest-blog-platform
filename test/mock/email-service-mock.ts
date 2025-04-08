import { MailService } from '../../src/mail/mail.service';

export class EmailServiceMock extends MailService {
  async sendConfirmationEmail(email: string, code:string){
    console.log('Call mock method sendConfirmationEmail / EmailServiceMock')
    return
  }
}