import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { BadRequestDomainException } from '../../../core/exception/domain-exception';

@Injectable()
export class AuthQueryRepository {
  constructor(private userRepository: UserRepository) {}
  async getMe(userId: string){
    const user = await this.userRepository.findById(userId)
    if(!user){
      throw BadRequestDomainException.create('Not user', 'User')
    }
    return {
      id: user.id,
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt
    }
  }
}