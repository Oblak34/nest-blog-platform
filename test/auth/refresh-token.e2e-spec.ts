import { HttpStatus, INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { CoreConfig } from '../../src/core/config/core.config';
import { Test } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { delay } from '../helpers/delay';

describe('POST api/auth/refresh-token', () => {
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

  it('200 Returns JWT accessToken in body and JWT refreshToken in cookie', async () => {
    const user: CreateUserDto = {
      login: 'Alice',
      password: 'qwerty',
      email: 'email@email.com',
    };
    await request(app.getHttpServer())
      .post(`/auth/registration`)
      .send(user)
      .expect(HttpStatus.NO_CONTENT)

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.email,
        password: user.password
      })
      .expect(HttpStatus.OK)

    await delay(1000)

    const resultRefresh = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', response.headers['set-cookie'][0])
      .expect(HttpStatus.OK)

    expect(resultRefresh.headers['set-cookie']).toBeDefined()
    expect(resultRefresh.body.accessToken).toEqual(expect.any(String))

    expect(resultRefresh.headers['set-cookie']).not.toBe(response.headers['set-cookie'])
    expect(resultRefresh.body.accessToken).not.toBe(response.body.accessToken)
  })
  it('401 JWT refreshToken not exist', async () => {
    const user: CreateUserDto = {
      login: 'Alice',
      password: 'qwerty',
      email: 'email@email.com',
    };
    await request(app.getHttpServer())
      .post(`/auth/registration`)
      .send(user)
      .expect(HttpStatus.NO_CONTENT)

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.email,
        password: user.password
      })
      .expect(HttpStatus.OK)

    const resultRefresh = await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NjkxNzgsImV4cCI6MTczODU2OTE5OH0.DTax5RjBQiEEcG1D7UZSRos8jLyQBBn6CAj52-gYkDs; Path=/; Secure; HttpOnly;")
      .expect(HttpStatus.UNAUTHORIZED)
  })
})