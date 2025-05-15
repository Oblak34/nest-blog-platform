import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from '../helpers/delete-all-data';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { UsersTestManager } from '../helpers/users-test-manager';

describe('/auth/me', () => {
  let app: INestApplication
  let userTestManager: UsersTestManager

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    appSetup(app);
    await app.init()
    await deleteAllData(app);
    userTestManager = new UsersTestManager(app)
  })
  beforeEach(async () => {
    await deleteAllData(app);
  });
  afterAll(async () => {
    await app.close()
  })

  it('200 get information about current user', async () => {
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
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)

    const token = response.body.accessToken
    const result = await request(app.getHttpServer())
      .get(`/auth/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(result.body.email).toEqual(user.email)
  })
  it('401 Unauthorized when get information about current user', async () => {
    const user: CreateUserDto = {
      login: 'Alice',
      password: 'qwerty',
      email: 'email@email.com',
    };
    await userTestManager.registrationUser(user)

    await request(app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)

    await request(app.getHttpServer())
      .get(`/auth/me`)
      .expect(HttpStatus.UNAUTHORIZED)
  })

})