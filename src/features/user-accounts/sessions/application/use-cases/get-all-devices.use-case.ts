import { RefreshTokenPayloadDto } from '../../../auth/api/input/refreshTokenPayload.dto';
import { CommandHandler, ICommandHandler, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { AuthSession, AuthSessionType, SessionDocument } from '../../domain/session.entity';
import { JwtService } from '@nestjs/jwt';

export class GetAllDevicesUseCaseCommand {
  constructor(public payload: RefreshTokenPayloadDto) {
  }
}

@QueryHandler(GetAllDevicesUseCaseCommand)
export class GetAllDevicesUseCase implements IQueryHandler<GetAllDevicesUseCaseCommand> {
  constructor(@InjectModel(AuthSession.name) private authSessionModel: AuthSessionType,
              private jwtService: JwtService) {
  }

  async execute(command: GetAllDevicesUseCaseCommand){

    const devices: SessionDocument[] = await this.authSessionModel.find({ user_id: command.payload.userId})

    return devices.map(dev => {
      return {
        ip: dev.ip,
        title: dev.device_name,
        lastActiveDate: dev.iat,
        deviceId: dev.device_id
      }
    })
  }
}