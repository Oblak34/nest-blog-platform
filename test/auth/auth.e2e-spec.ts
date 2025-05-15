import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from '../helpers/users-test-manager';
import { deleteAllData } from '../helpers/delete-all-data';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { IMailService, MailService } from '../../src/mail/mail.service';
import { appSetup } from '../../src/setup/app.setup';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../../src/features/user-accounts/users/domain/user.entity';
import { Model } from 'mongoose';
import { ThrottlerStorageService } from '@nestjs/throttler';

class MockMailService implements IMailService {
  async sendUserRegistration(login: string, email: string, code: string) {
    await console.log('not realy send')
  }
  async sendUserRecoveryCode(login: string, email: string, code: string | null) {
    await console.log('not realy send')
  }
}

describe('/auth', () => {
  let app: INestApplication
  let userTestManager: UsersTestManager
  let UserModel
  let throttlerStorage

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
      providers: [ThrottlerStorageService]
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
    throttlerStorage = app.get<ThrottlerStorageService>(ThrottlerStorageService);

    console.log(throttlerStorage)
    throttlerStorage.storage.clear();
  });
  afterAll(async () => {
    await app.close()
  })

  it('200, returns JWT accessToken', async () => {
      const user: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send(user)
        .expect(HttpStatus.NO_CONTENT)

      const result = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          loginOrEmail: user.login,
          password: user.password
        })
        .expect(HttpStatus.OK)

      expect(result.body.accessToken).toBeDefined()
    })
  it('400, if the inputModel has incorrect values', async () => {
      const user: CreateUserDto = {
        login: 'ui',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send(user)
        .expect(HttpStatus.BAD_REQUEST)

      const result = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          loginOrEmail: user.login,
          password: user.password
        })
        .expect(HttpStatus.UNAUTHORIZED)

      expect(result.body.accessToken).toBeUndefined()
    })
  it('401, if the password or login or email is wrong', async () => {
      const user: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send(user)
        .expect(HttpStatus.NO_CONTENT)

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          loginOrEmail: user.login,
          password: 'bad_password'    // incorrect password
        })
        .expect(HttpStatus.UNAUTHORIZED)

    })
  it('status 204, registration success, input data is accepted', async () => {
      const body: CreateUserDto = {
        login: 'Mary',
        password: 'qwerty',
        email: 'gmail@gmail.com',
      };
      const result = await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send(body)
        .expect(HttpStatus.NO_CONTENT)
  })
  it('status 400, incorrect value', async () => {
      const body: CreateUserDto = {
        login: 'Al', // incorrect login
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send(body)
        .expect(HttpStatus.BAD_REQUEST)
    })
  it('status 429, more than 5 attempts from one IP-address during 10 seconds', async () => {
      await userTestManager.registrationSeveralUsers(5)
      const body: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())     // registration 6 user
        .post(`/${GLOBAL_PREFIX}/auth/registration`)
        .send(body)
        .expect(HttpStatus.TOO_MANY_REQUESTS)
    })
  it('204, confirmation', async () => {
      const body: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await userTestManager.registrationUser(body)

      const user = await UserModel.findOne({'accountData.email' : body.email})
      expect(user.emailConfirmation.isConfirmed).toBe(false)  // user не поддтвержден

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
        .send({
          code: user.emailConfirmation.confirmationCode
        })
        .expect(HttpStatus.NO_CONTENT)

      const updatedUser = await UserModel.findOne({'accountData.email' : body.email})
      expect(updatedUser.emailConfirmation.isConfirmed).toBe(true)  // теперь user поддтвержден
  })
  it('400, if the confirmation code is incorrect, expired or already been applied', async () => {
      const body: CreateUserDto = {
        login: 'Alik',
        password: 'qwerty',
        email: 'molik@email.com',
      };
      await userTestManager.registrationUser(body)

      const user = await UserModel.findOne({'accountData.email' : body.email})
      expect(user.emailConfirmation.isConfirmed).toBe(false)  // user не поддтвержден

      await request(app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
        .send({
          code: user.emailConfirmation.confirmationCode   // код заекспарен
        })
        .expect(HttpStatus.BAD_REQUEST)

    })
  it('204, input data is accepted.Email with confirmation code will be send to passed email address', async () => {
      const body: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await userTestManager.registrationUser(body)

      await request(app.getHttpServer())
        .post('registration-email-resending')
        .send(body.email)
        .expect(HttpStatus.NO_CONTENT)

    })
})