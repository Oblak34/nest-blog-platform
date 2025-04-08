import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { CreateUserDto } from '../../src/features/user-accounts/api/input/create-user.dto';
import { UserViewDto } from '../../src/features/user-accounts/api/output/user-view.dto';
import { delay } from './delay';

export class UsersTestManager {
  constructor(private app: INestApplication) {}

  async createUser(createModel: CreateUserDto, statusCode: number = HttpStatus.CREATED){
      const response = await request(this.app.getHttpServer())
        .post(`/${GLOBAL_PREFIX}/users`)
        .send(createModel)
        .auth('admin', 'qwerty')
        .expect(statusCode)
      return response.body
  }

  async registrationUser(createModel: CreateUserDto,statusCode: number = HttpStatus.NO_CONTENT){
    const response = await request(this.app.getHttpServer())
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
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



}