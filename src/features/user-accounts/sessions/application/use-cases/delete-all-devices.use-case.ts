import { RefreshTokenPayloadDto } from '../../../auth/api/input/refreshTokenPayload.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { AuthSession, AuthSessionType } from '../../domain/session.entity';
import { JwtService } from '@nestjs/jwt';

export class DeleteAllDevicesUseCaseCommand {
  constructor(public payload: RefreshTokenPayloadDto) {
  }
}

@CommandHandler(DeleteAllDevicesUseCaseCommand)
export class DeleteAllDevicesUseCase implements ICommandHandler<DeleteAllDevicesUseCaseCommand> {
  constructor(@InjectModel(AuthSession.name) private authSessionModel: AuthSessionType,
              private jwtService: JwtService) {
  }

  async execute(command: DeleteAllDevicesUseCaseCommand){
    return await this.authSessionModel.deleteMany({ user_id: command.payload.userId, device_id: {$ne: command.payload.deviceId}})
  }
}