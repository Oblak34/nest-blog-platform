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

  it('429, More than 5 attempts from one IP-address during 10 seconds', async () => {
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
        password: user.password
      })
      .expect(HttpStatus.OK)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)

    //await delay(10000)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.TOO_MANY_REQUESTS)

    await delay(10000)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)
  })
})