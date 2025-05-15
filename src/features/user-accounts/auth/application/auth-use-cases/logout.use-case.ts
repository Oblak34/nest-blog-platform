import { RefreshTokenPayloadDto } from '../../api/input/refreshTokenPayload.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { AuthSession, AuthSessionType, SessionDocument } from '../../../sessions/domain/session.entity';
import { UnauthorizedDomainException } from '../../../../../core/exception/domain-exception';
import { JwtService } from '@nestjs/jwt';

export class LogoutUseCaseCommand {
  constructor(public payload: RefreshTokenPayloadDto) {
  }
}

@CommandHandler(LogoutUseCaseCommand)
export class LogoutUseCase implements ICommandHandler<LogoutUseCaseCommand> {
  constructor(@InjectModel(AuthSession.name) private authSessionModel: AuthSessionType,
              private jwtService: JwtService) {
  }
  async execute(command: LogoutUseCaseCommand){

    const session: SessionDocument | null = await this.authSessionModel.findOne({ device_id: command.payload.deviceId });
    if(!session){
      throw  UnauthorizedDomainException.create('Not session', 'session')
    }

    // delete session
    await session.deleteOne()
  }

}
