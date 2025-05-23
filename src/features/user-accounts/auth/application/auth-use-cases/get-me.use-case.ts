import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../../users/domain/user.entity';
import { BadRequestDomainException } from '../../../../../core/exception/domain-exception';
import { GetUserByIdUseCaseCommand } from '../../../users/application/user-use-cases/get-user-by-id.use-case';

export class GetMeUseCaseCommand {
  constructor(public userId: string) {
  }
}

@QueryHandler(GetMeUseCaseCommand)
export class GetMeUseCase implements IQueryHandler<GetMeUseCaseCommand> {
  constructor(private queryBus: QueryBus) {
  }

  async execute(command: GetMeUseCaseCommand){
    const user = await this.queryBus.execute(new GetUserByIdUseCaseCommand(command.userId))
    console.log('user  ', user)
    if(!user){
      throw BadRequestDomainException.create('Not user', 'User')
    }
    return {
      email: user.email,
      login: user.login,
      userId: user.id
    }
  }
}

