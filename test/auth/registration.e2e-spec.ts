import { IMailService, MailService } from '../../src/mail/mail.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from '../helpers/users-test-manager';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { delay } from '../helpers/delay';

export class MockMailService implements IMailService {
  async sendUserRegistration(login: string, email: string, code: string) {
    await console.log('not realy send')
  }
  async sendUserRecoveryCode(login: string, email: string, code: string | null) {
    await console.log('not realy send')
  }
}

describe('/registration', () => {
  let app: INestApplication
  let userTestManager: UsersTestManager

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
  })
  beforeEach(async () => {
    await deleteAllData(app);
  });
  afterAll(async () => {
    await app.close()
  })

  it('status 204, registration success, input data is accepted', async () => {
    const body: CreateUserDto = {
      login: 'Mary',
      password: 'qwerty',
      email: 'gmail@gmail.com',
    };
    const result = await request(app.getHttpServer())
      .post(`/auth/registration`)
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
      .post(`/auth/registration`)
      .send(body)
      .expect(HttpStatus.BAD_REQUEST)
  })
  it('status 429, more than 5 attempts from one IP-address during 10 seconds', async () => {
    await userTestManager.registrationSeveralUsers(3)
    const body: CreateUserDto = {
      login: 'Alice',
      password: 'qwerty',
      email: 'email@email.com',
    };
    await request(app.getHttpServer())     // registration 6 user
      .post(`/auth/registration`)
      .send(body)
      .expect(HttpStatus.TOO_MANY_REQUESTS)

    await delay(10000)

    await request(app.getHttpServer())     // registration 6 user
      .post(`/auth/registration`)
      .send(body)
      .expect(HttpStatus.NO_CONTENT)

  })
})