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

describe('/security', () => {
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

  describe('GET /security/ devices', () => {
    it('200 get all devices with active sessions for current user', async () => {
      const user: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/auth/registration`)
        .send(user)
        .expect(HttpStatus.NO_CONTENT)

      const logined = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: user.login,
          password: user.password
        })
        .expect(HttpStatus.OK)

      await request(app.getHttpServer())
        .get('/security/devices')
        .set('Cookie', logined.headers['set-cookie'][0])
        .expect(HttpStatus.OK)
    })
    it('401 Unauthorized', async () => {
      const user: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/auth/registration`)
        .send(user)
        .expect(HttpStatus.NO_CONTENT)

      const logined = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: user.login,
          password: user.password
        })
        .expect(HttpStatus.OK)

      await request(app.getHttpServer())
        .get('/security/devices')
        .expect(401)
    })
  })

  describe('DELETE api/security/devices', () => {
    it("204 Delete all other device's sessions", async () => {
      const user: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/auth/registration`)
        .send(user)
        .expect(HttpStatus.NO_CONTENT)

      // залогинем три сессии одного пользователя с разных клиентов
      const loginedChrome = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: user.login,
          password: user.password
        })
        .expect(HttpStatus.OK)

      const loginedYandex = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Yandex')
        .send({
          loginOrEmail: user.email,
          password: user.password
        })
        .expect(HttpStatus.OK)

      const loginedSmartphone = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Smartphone')
        .send({
          loginOrEmail: user.email,
          password: user.password
        })
        .expect(HttpStatus.OK)

      // запрашиваем все сессии, должно быть 3
      const allSessions = await request(app.getHttpServer())
        .get('/security/devices')
        .set('Cookie', loginedYandex.headers['set-cookie'][0])
        .expect(HttpStatus.OK)

      // проверяем что их три
      expect(allSessions.body.length).toBe(3)

      // удаляем все сессии, находясь в сессии Yandex
      await request(app.getHttpServer())
        .delete('/security/devices')
        .set('Cookie', loginedYandex.headers['set-cookie'][0])
        .expect(HttpStatus.NO_CONTENT)

      // запрашиваем все сессии
      const sessions = await request(app.getHttpServer())
        .get('/security/devices')
        .set('Cookie', loginedYandex.headers['set-cookie'][0])
        .expect(HttpStatus.OK)

      // проверяем, теперь все удалены кроме текущей
      expect(sessions.body.length).toBe(1)

      // проверяем какая из трех осталась
      expect(sessions.body[0].title).toBe('Yandex')
    })
    it("401 Unauthorized", async () => {
      // пытаемся удалить без куки
      await request(app.getHttpServer())
        .delete('/security/devices')
        .expect(HttpStatus.UNAUTHORIZED)
    })
  })

  describe('DELETE api/security/devices/{deviceID}', () => {
    it("Delete device by id (204, 401, 403, 404)", async () => {
      const user: CreateUserDto = {
        login: 'Alice',
        password: 'qwerty',
        email: 'email@email.com',
      };
      await request(app.getHttpServer())
        .post(`/auth/registration`)
        .send(user)
        .expect(HttpStatus.NO_CONTENT)

      await delay(10000)
      // залогинем три сессии одного пользователя с разных клиентов
      const loginedChrome = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: user.login,
          password: user.password
        })
        .expect(HttpStatus.OK)

      const loginedYandex = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Yandex')
        .send({
          loginOrEmail: user.email,
          password: user.password
        })
        .expect(HttpStatus.OK)

      const loginedMozzila = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Smartphone')
        .send({
          loginOrEmail: user.email,
          password: user.password
        })
        .expect(HttpStatus.OK)

      // запрашиваем все сессии, должно быть 3
      const allSessions = await request(app.getHttpServer())
        .get('/security/devices')
        .set('Cookie', loginedYandex.headers['set-cookie'][0])
        .expect(HttpStatus.OK)

      // проверяем что их три
      expect(allSessions.body.length).toBe(3)

      // найдем сессию Yandex
      const sessionYandex = allSessions.body.find(item => item.title == 'Yandex')

      // удаляем сессию Yandex по id
      await request(app.getHttpServer())
        .delete('/security/devices/' + sessionYandex.deviceId)
        .set('Cookie', loginedChrome.headers['set-cookie'][0])
        .expect(HttpStatus.NO_CONTENT)

      // запрашиваем все сессии после удаления
      const response = await request(app.getHttpServer())
        .get('/security/devices')
        .set('Cookie', loginedChrome.headers['set-cookie'][0])
        .expect(HttpStatus.OK)

      // проверяем что их две
      expect(response.body.length).toBe(2)

      // ищем снова Yandex
      const foundYandex = response.body.find(item => item.title == 'Yandex')

      // сессия Yandex не найдена
      expect(foundYandex).toBeUndefined()


      const sessionChrome = allSessions.body.find(item => item.title == 'Chrome')

      // 401 UNAUTHORIZED
      // пытаемся удалить сессию Chrome по id без токена
      await request(app.getHttpServer())
        .delete('/security/devices/' + sessionChrome.deviceId)
        .expect(HttpStatus.UNAUTHORIZED)

      // 404 NOT_FOUND
      // пытаемся удалить сессию Yandex, которая уже удалена
      await request(app.getHttpServer())
        .delete('/security/devices/' + sessionYandex.deviceId)
        .set('Cookie', loginedMozzila.headers['set-cookie'][0])
        .expect(HttpStatus.NOT_FOUND)


      // регистрируем второго юзера и логиним

      const user2: CreateUserDto = {
        login: 'Danil',
        password: 'qwerty1',
        email: 'danilka@email.com',
      };
      await request(app.getHttpServer())
        .post(`/auth/registration`)
        .send(user2)
        .expect(HttpStatus.NO_CONTENT)

      const loginedUser2 = await request(app.getHttpServer())
        .post(`/auth/login`)
        .set('User-Agent', 'Chrome')
        .send({
          loginOrEmail: user2.login,
          password: user2.password
        })
        .expect(HttpStatus.OK)

      // 403 FORBIDDEN
      // пытаемся из сессии user2 удалить сессию user1
      await request(app.getHttpServer())
        .delete('/security/devices/' + sessionChrome.deviceId)
        .set('Cookie', loginedUser2.headers['set-cookie'][0])
        .expect(HttpStatus.FORBIDDEN)

    })
  })
})