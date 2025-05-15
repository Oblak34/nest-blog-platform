import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from '../helpers/users-test-manager';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/mail/mail.service';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { MockMailService } from './registration.e2e-spec';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../src/features/user-accounts/users/domain/user.entity';
import { getModelToken } from '@nestjs/mongoose';
import { delay } from '../helpers/delay';

describe('/new-password', () => {
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

  it('204 If code is valid and new password is accepted', async () => {
    const body: CreateUserDto = {
      login: 'Mary',
      password: 'qwerty',
      email: 'gmail@gmail.com',
    };
    await userTestManager.registrationUser(body)
    const user = await UserModel.findOne({'accountData.email' : body.email})

    await request(app.getHttpServer())
      .post(`/auth/new-password`)
      .send({
        newPassword: "correctPass",
        recoveryCode: user.emailConfirmation.passwordRecoveryCode
      })
      .expect(HttpStatus.NO_CONTENT)
  })

  it('400 If the inputModel has incorrect value (for incorrect password length) or RecoveryCode is incorrect or expired', async () => {
    const body: CreateUserDto = {
      login: 'Mary',
      password: 'qwerty',
      email: 'gmail@gmail.com',
    };
    await userTestManager.registrationUser(body)

    const user = await UserModel.findOne({'accountData.email' : body.email})
    await request(app.getHttpServer())
      .post(`/auth/new-password`)
      .send({
        newPassword: "Pass", // пароль короткий, меньше 6 символов
        recoveryCode: user.emailConfirmation.passwordRecoveryCode
      })
      .expect(HttpStatus.BAD_REQUEST)
  })
  it('429 More than 5 attempts from one IP-address during 10 seconds', async () => {
    const body: CreateUserDto = {
      login: 'Anfisa',
      password: 'qwerty',
      email: 'anfa@gmail.com',
    };
    await userTestManager.registrationUser(body)

    const user = await UserModel.findOne({'accountData.email' : body.email})

    await request(app.getHttpServer())
      .post(`/auth/new-password`)
      .send({
        newPassword: "correctPass",
        recoveryCode: user.emailConfirmation.passwordRecoveryCode
      })
      .expect(HttpStatus.NO_CONTENT)

    const user1 = await UserModel.findOne({'accountData.email' : body.email})

    await request(app.getHttpServer())
      .post(`/auth/new-password`)
      .send({
        newPassword: "correctPass",
        recoveryCode: user1.emailConfirmation.passwordRecoveryCode
      })
      .expect(HttpStatus.BAD_REQUEST)

    const user2 = await UserModel.findOne({'accountData.email' : body.email})

    await request(app.getHttpServer())
      .post(`/auth/new-password`)
      .send({
        newPassword: "correctPass",
        recoveryCode: user2.emailConfirmation.passwordRecoveryCode
      })
      .expect(HttpStatus.BAD_REQUEST)

    const user3 = await UserModel.findOne({'accountData.email' : body.email})

    await request(app.getHttpServer())
      .post(`/auth/new-password`)
      .send({
        newPassword: "correctPass",
        recoveryCode: user3.emailConfirmation.passwordRecoveryCode
      })
      .expect(HttpStatus.TOO_MANY_REQUESTS)

    await delay(10000)

    await request(app.getHttpServer())
      .post(`/auth/new-password`)
      .send({
        newPassword: "correctPass",
        recoveryCode: user.emailConfirmation.passwordRecoveryCode
      })
      .expect(HttpStatus.BAD_REQUEST)
  })

})