import { IMailService, MailService } from '../../src/mail/mail.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from '../helpers/users-test-manager';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../src/features/user-accounts/users/domain/user.entity';
import { getModelToken } from '@nestjs/mongoose';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { delay } from '../helpers/delay';

class MockMailService implements IMailService {
  async sendUserRegistration(login: string, email: string, code: string) {
    await console.log('not realy send')
  }
  async sendUserRecoveryCode(login: string, email: string, code: string | null) {
    await console.log('not realy send')
  }
}

describe('/registration-confirmation', () => {
  let app: INestApplication
  let userTestManager: UsersTestManager
  let UserModel

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(MailService).useClass(MockMailService)
      //.overrideProvider(AuthConfig).useValue({skipPasswordCheck: false, jwtSecret: JWT_MODULE_OPTIONS } as AuthConfig)
      .compile()

    app = moduleFixture.createNestApplication()
    appSetup(app);
    await app.init()
    userTestManager = new UsersTestManager(app)
    await deleteAllData(app);
    UserModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
  })
  beforeEach(async () => {
    await deleteAllData(app);
  });
  afterAll(async () => {
    await app.close()
  })

  it('204, confirmation', async () => {
    const body: CreateUserDto = {
      login: 'Bob',
      password: 'qwerty',
      email: 'bobby@email.com',
    };
    await userTestManager.registrationUser(body)

    const user = await UserModel.findOne({'accountData.email' : body.email})
    expect(user.emailConfirmation.isConfirmed).toBe(false)  // user не поддтвержден

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode
      })
      .expect(HttpStatus.NO_CONTENT)

    const updatedUser = await UserModel.findOne({'accountData.email' : body.email})
    expect(updatedUser.emailConfirmation.isConfirmed).toBe(true)  // теперь user поддтвержден
  })
  it('400, if the confirmation code is incorrect, expired or already been applied', async () => {
    const body: CreateUserDto = {
      login: 'Vera',
      password: 'qwerty',
      email: 'vera@email.com',
    };
    await userTestManager.registrationUser(body)
    await delay(4000)

    const user = await UserModel.findOne({'accountData.email' : body.email})

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode   // код заекспарен
      })
      .expect(HttpStatus.BAD_REQUEST)
  })
  it('429, More than 5 attempts from one IP-address during 10 seconds', async () => {
    const body: CreateUserDto = {
      login: 'Timofey',
      password: 'qwerty',
      email: 'timoo@email.com',
    };
    await delay(10000)
    await userTestManager.registrationUser(body)
    const user = await UserModel.findOne({'accountData.email' : body.email})

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode
      })
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode
      })
      .expect(HttpStatus.BAD_REQUEST)

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode
      })
      .expect(HttpStatus.BAD_REQUEST)

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode
      })
      .expect(HttpStatus.BAD_REQUEST)

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode
      })
      .expect(HttpStatus.BAD_REQUEST)

    // 6-ой request за 10 секунд и ошибка 429

    await request(app.getHttpServer())
      .post(`/auth/registration-confirmation`)
      .send({
        code: user.emailConfirmation.confirmationCode
      })
      .expect(HttpStatus.TOO_MANY_REQUESTS)
  })
})
