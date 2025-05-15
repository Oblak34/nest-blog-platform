import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { CreateUserDto } from '../../src/features/user-accounts/users/api/input/create-user.dto';
import { UserViewDto } from '../../src/features/user-accounts/users/api/output/user-view.dto';
import { delay } from './delay';

export class UsersTestManager {
  constructor(private app: INestApplication) {}

  async createUser(createModel: CreateUserDto, statusCode: number = HttpStatus.CREATED){
      const response = await request(this.app.getHttpServer())
        .post(`/users`)
        .send(createModel)
        .auth('admin', 'qwerty')
        .expect(statusCode)
    console.log(response.body)
      return response.body
  }
  async registrationUser(createModel: CreateUserDto,statusCode: number = HttpStatus.NO_CONTENT){
    const response = await request(this.app.getHttpServer())
      .post(`/auth/registration`)
      .send(createModel)
      .expect(statusCode)
    return response.body
  }
  async registrationSeveralUsers(count: number){
    const usersPromises = [] as Promise<UserViewDto>[]

    for(let i = 0; i < count; i++){
      const dto: CreateUserDto = {
        login: `tost` + i,
        password: 'abcd123',
        email: `tost${i}@mail.ru`
      }
      delay(50)
      const response = await this.registrationUser(dto)
      usersPromises.push(response)
    }
    return usersPromises
  }
  async createSeveralUsers(count: number): Promise<UserViewDto[]>{
    const usersPromises = [] as Promise<UserViewDto>[]

    for(let i = 0; i < count; i++){
      await delay(50)
      const response = this.createUser({
        login: `test` + i,
        email: `test${i}@mail.ru`,
        password: 'abcd123'
      })
      usersPromises.push(response)
    }
    return Promise.all(usersPromises)
  }
  async createUserAndLogin(user){
    await this.registrationUser(user)
    const loginUser = await request(this.app.getHttpServer())
      .post(`/auth/login`)
      .set('User-Agent', 'Chrome')
      .send({
        loginOrEmail: user.login,
        password: user.password
      })
      .expect(HttpStatus.OK)

    return loginUser.body
  }
}

export const user1 = {
  login: 'Nina',
  password: '123abc',
  email: 'ninajan@mail.ru'
}

export const user2 = {
  login: 'Mike',
  password: 'abc123',
  email: 'mikeli@mail.ru'
}

export const user3 = {
  login: 'Gorge',
  password: '123aaa',
  email: 'murmyau@mail.ru'
}

export const user4 = {
  login: 'Lambert',
  password: 'aaa111',
  email: 'lamba@mail.ru'
}