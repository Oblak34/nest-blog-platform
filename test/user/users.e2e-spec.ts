import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from '../helpers/users-test-manager';
import { deleteAllData } from '../helpers/delete-all-data';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { NestFactory } from '@nestjs/core';
import { CoreConfig } from '../../src/core/config/core.config';

describe('/users', () => {
  let app: INestApplication
  let userTestManager: UsersTestManager

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
    userTestManager = new UsersTestManager(app)
    await deleteAllData(app);
  })

  beforeEach(async () => {
    await deleteAllData(app);
  })
  afterAll(async () => {
    await app.close()
  })

  describe('POST', () => {
    it('status 201, should create user', async () => {
      const body: CreateUserDto = {
        login: 'namde1',
        password: 'qwerty',
        email: 'email@email.com',
      };
      const response = await userTestManager.createUser(body);

      expect(response).toEqual({
        id: expect.any(String),
        login: body.login,
        email: body.email,
        createdAt: expect.any(String),
      });
    });
    it('status 400, if the inputModel has incorrect login', async () => {
      const body: CreateUserDto = {
        login: 'na',  // incorrect login
        password: 'qwerty',
        email: 'email@email.em',
      };

      const res = await request(app.getHttpServer())
        .post(`/users`)
        .send(body)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.BAD_REQUEST)
      expect(res.body.errorsMessages[0].field).toBe('login')

    });
    it('status 400, if the inputModel has incorrect email', async () => {
      const body: CreateUserDto = {
        login: 'name1',
        password: 'qwerty',
        email: 'email@emailem', // incorrect email
      };

      const res = await request(app.getHttpServer())
        .post(`/users`)
        .send(body)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.BAD_REQUEST)
      expect(res.body.errorsMessages[0].field).toBe('email')
    });
    it('status 400, if the inputModel has incorrect password', async () => {
      const body: CreateUserDto = {
        login: 'name1',
        password: 'qwertyqwertyqwertyqwertyqwertyqwertyqwerty',  // incorrect password
        email: 'email@emailem',
      };

      const res = await request(app.getHttpServer())
        .post(`/users`)
        .send(body)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.BAD_REQUEST)
      expect(res.body.errorsMessages[0].field).toBe('password')
    });
    it('status 401 Unauthorized', async () => {
      const body: CreateUserDto = {
        login: 'name1',
        password: 'qwertyqwertyqwertyqwertyqwertyqwertyqwerty',  // incorrect password
        email: 'email@emailem',
      };

      await request(app.getHttpServer())
        .post(`/users`)
        .send(body)
        .auth('admin111', 'qwerty111') // incorrect login and password
        .expect(HttpStatus.UNAUTHORIZED)
    });
  })
  describe('GET', () => {
    it('status 200, should get all users', async () => {
      const users = await userTestManager.createSeveralUsers(12)
      const response = await request(app.getHttpServer())
        .get(`/users?pageNumber=2&sortDirection=asc`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK)

      expect(response.body.totalCount).toBe(12);
      expect(response.body.items).toHaveLength(2)
      expect(response.body.pagesCount).toBe(2);
      //asc sorting
      expect(response.body.items[1]).toEqual(users[users.length - 1]);

    })
    it('status 401 Unauthorized', async () => {
      const users = await userTestManager.createSeveralUsers(12)
      const response = await request(app.getHttpServer())
        .get(`/users?pageNumber=2&sortDirection=asc`)
        .auth('adm', 'qwerty')  // inccorect login
        .expect(HttpStatus.UNAUTHORIZED)
    })
  })
  describe('DELETE', () => {
    it('status 204, should delete user by id', async () => {
      const body: CreateUserDto = {
        login: 'name1',
        password: 'qwerty',
        email: 'email@email.em',
      };
      const result = await userTestManager.createUser(body);
      await request(app.getHttpServer())
        .delete(`/users/` + result.id)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT)

      const response = await request(app.getHttpServer())
        .get(`/users`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK)

      expect(response.body.items).toHaveLength(0)


    })
    it('status 401 Unauthorized', async () => {
      const body: CreateUserDto = {
        login: 'name1',
        password: 'qwerty',
        email: 'email@email.em',
      };
      const result = await userTestManager.createUser(body);
      await request(app.getHttpServer())
        .delete(`/users/` + result.id)
        .expect(HttpStatus.UNAUTHORIZED)

      const response = await request(app.getHttpServer())
        .get(`/users`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.OK)

      expect(response.body.items).toHaveLength(1)
    })
    it('status 404, If specified user is not exists', async () => {
      const body: CreateUserDto = {
        login: 'name1',
        password: 'qwerty',
        email: 'email@email.em',
      };
      const result = await userTestManager.createUser(body);
      await request(app.getHttpServer())
        .delete(`/users/` + result.id)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT)

      await request(app.getHttpServer())
        .delete(`/users/` + result.id)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})



