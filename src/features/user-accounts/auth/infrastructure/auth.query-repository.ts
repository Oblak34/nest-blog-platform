import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../users/infrastructure/user.repository';
import { BadRequestDomainException } from '../../../../core/exception/domain-exception';

@Injectable()
export class AuthQueryRepository {
  constructor(private userRepository: UserRepository) {}
  async getMe(userId: string){
    const user = await this.userRepository.findById(userId)
    if(!user){
      throw BadRequestDomainException.create('Not user', 'User')
    }
    return {
      email: user.accountData.email,
      login: user.accountData.login,
      userId: user.id
    }
  }
}