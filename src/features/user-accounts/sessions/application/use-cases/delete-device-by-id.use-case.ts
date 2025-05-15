import { RefreshTokenPayloadDto } from '../../../auth/api/input/refreshTokenPayload.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { AuthSession, AuthSessionType, SessionDocument } from '../../domain/session.entity';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '../../../../../core/exception/domain-exception';

export class DeleteDevicesByIdUseCaseCommand {
  constructor(public payload: RefreshTokenPayloadDto, public idDevice: string) {
  }
}

@CommandHandler(DeleteDevicesByIdUseCaseCommand)
export class DeleteDeviceByIdUseCase implements ICommandHandler<DeleteDevicesByIdUseCaseCommand> {
  constructor(@InjectModel(AuthSession.name) private authSessionModel: AuthSessionType) {
  }

  async execute(command: DeleteDevicesByIdUseCaseCommand){

    const foundDevice: SessionDocument | null = await this.authSessionModel.findOne({device_id: command.idDevice})

    if(!foundDevice){
      throw NotFoundDomainException.create('Not session', 'session')
    }
    if(command.payload.userId !== foundDevice.user_id){
      throw ForbiddenDomainException.create('If try to delete the deviceId of other user', 'user')
    }
    await this.authSessionModel.deleteOne({device_id: command.idDevice})
  }
}