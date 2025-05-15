import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { NestFactory } from '@nestjs/core';
import { CoreConfig } from '../../src/core/config/core.config';
import { delay } from '../helpers/delay';

describe('/login', () => {
  let app: INestApplication

  beforeAll(async () => {
    const appContext = await NestFactory.createApplicationContext(AppModule)
    const coreConfig = appContext.get<CoreConfig>(CoreConfig)
    const DynamicAppModule = await AppModule.forRoot(coreConfig)
    const moduleFixture = await Test.createTestingModule({
      imports: [DynamicAppModule]
    }).compile()


    app = moduleFixture.createNestApplication()
    appSetup(app);
    await app.init()
    await deleteAllData(app);
  })
  beforeEach(async () => {
    await deleteAllData(app);
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
      .post(`/auth/registration`)
      .send(user)
      .expect(HttpStatus.NO_CONTENT)

    const result = await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
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
      .post(`/auth/registration`)
      .send(user)
      .expect(HttpStatus.BAD_REQUEST)

    const result = await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
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
      .post(`/auth/registration`)
      .send(user)
      .expect(HttpStatus.NO_CONTENT)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: 'bad_password'    // incorrect password
      })
      .expect(HttpStatus.UNAUTHORIZED)

  })
})