import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service'

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.mail.ru',
        secure: false,
        auth: {
          user: "oblak.00@bk.ru",
          pass: "yp0BWveaWc2hcAea2Q96"
        },
      },
      defaults: {
        from: '"Admin" <oblak.00@bk.ru>'
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      }
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {}