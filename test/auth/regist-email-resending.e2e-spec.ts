import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { IMailService, MailService } from '../../src/mail/mail.service';
import { MockMailService } from './registration.e2e-spec';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../src/features/user-accounts/users/domain/user.entity';
import { getModelToken } from '@nestjs/mongoose';
import { delay } from '../helpers/delay';

describe('/registration-email-resending', () => {
  let app: INestApplication
  let sendEmailMethod
  let UserModel

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(MailService).useClass(MockMailService)
      .compile()

    app = moduleFixture.createNestApplication()
    appSetup(app);
    await app.init()
    await deleteAllData(app);

    UserModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    sendEmailMethod = (app.get(MailService).sendUserRegistration = jest
      .fn()
      .mockImplementation(() => Promise.resolve()));
  })
  beforeEach(async () => {
    await deleteAllData(app);
  });
  afterAll(async () => {
    await app.close()
  })

  it('204 Input data is accepted. Email with confirmation code will be send to passed email address.', async () => {
    const body: CreateUserDto = {
      login: 'Mary',
      password: 'qwerty',
      email: 'gmail@gmail.com',
    };
    await request(app.getHttpServer())
      .post(`/auth/registration`)
      .send(body)
      .expect(HttpStatus.NO_CONTENT)
    await request(app.getHttpServer())
      .post(`/auth/registration-email-resending`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    expect(sendEmailMethod).toHaveBeenCalled()
  })
  it('400 If the inputModel has incorrect values', async () => {
    const body: CreateUserDto = {
      login: 'Mary',
      password: 'qwerty',
      email: 'gmail@gmail.com',
    };
    await request(app.getHttpServer())
      .post(`/auth/registration`)
      .send(body)
      .expect(HttpStatus.NO_CONTENT)

    const user = await UserModel.findOne({ 'accountData.email': body.email })
    user.emailConfirmation.isConfirmed = true
    await user.save()

    await request(app.getHttpServer())
      .post(`/auth/registration-email-resending`)
      .send({email: body.email})
      .expect(HttpStatus.BAD_REQUEST, {
        errorsMessages: [
          { message: 'Such a user already exists', field: 'email'}
        ]
      })

    expect(sendEmailMethod).toHaveBeenCalled()
  })
  it('429 More than 5 attempts from one IP-address during 10 seconds', async () => {
    const body: CreateUserDto = {
      login: 'Den',
      password: 'qwerty',
      email: 'denis@gmail.com',
    };
    await request(app.getHttpServer())
      .post(`/auth/registration`)
      .send(body)
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/registration-email-resending`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/registration-email-resending`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/registration-email-resending`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/registration-email-resending`)
      .send({email: body.email})
      .expect(HttpStatus.TOO_MANY_REQUESTS)

    await delay(10000)

    await request(app.getHttpServer())
      .post(`/auth/registration-email-resending`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

  })
})