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
import { delay } from '../helpers/delay';

describe('/password-recovery', () => {
  let app: INestApplication
  let userTestManager: UsersTestManager
  let sendEmailMethod

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

  it('204 Even if current email is not registered (for prevent user\'s email detection)', async () => {
    const body: CreateUserDto = {
      login: 'Mary',
      password: 'qwerty',
      email: 'gmail@gmail.com',
    };
    await userTestManager.registrationUser(body)

    await request(app.getHttpServer())
      .post(`/auth/password-recovery`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    expect(sendEmailMethod).toHaveBeenCalled()
  })
  it('400 If the inputModel has invalid email', async () => {
    await request(app.getHttpServer())
      .post(`/auth/password-recovery`)
      .send({email: 'invaidemail^gmail.com'})
      .expect(HttpStatus.BAD_REQUEST)
  })
  it('429 More than 5 attempts from one IP-address during 10 seconds', async () => {
    const body: CreateUserDto = {
      login: 'Mary',
      password: 'qwerty',
      email: 'gmail@gmail.com',
    };
    await userTestManager.registrationUser(body)

    await request(app.getHttpServer())
      .post(`/auth/password-recovery`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/password-recovery`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/password-recovery`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/password-recovery`)
      .send({email: body.email})
      .expect(HttpStatus.TOO_MANY_REQUESTS)

    await delay(10000)

    await request(app.getHttpServer())
      .post(`/auth/password-recovery`)
      .send({email: body.email})
      .expect(HttpStatus.NO_CONTENT)
  })
})