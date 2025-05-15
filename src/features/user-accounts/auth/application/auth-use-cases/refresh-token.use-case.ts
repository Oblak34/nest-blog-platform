import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { AuthSession, AuthSessionType, SessionDocument } from '../../../sessions/domain/session.entity';
import { RefreshTokenPayloadDto } from '../../api/input/refreshTokenPayload.dto';
import { UnauthorizedDomainException } from '../../../../../core/exception/domain-exception';

export class RefreshTokenUseCaseCommand {
  constructor(public payload: RefreshTokenPayloadDto) {
  }
}

@CommandHandler(RefreshTokenUseCaseCommand)
export class RefreshTokenUseCase implements ICommandHandler<RefreshTokenUseCaseCommand> {
  constructor(private jwtService: JwtService,
              @InjectModel(AuthSession.name) private authSessionModel: AuthSessionType) {
  }

  async execute(command: RefreshTokenUseCaseCommand){
    if(command.payload.exp > new Date()){
      throw UnauthorizedDomainException.create('token expire', 'token')
    }

    const accessToken = await this.jwtService.sign({ userId: command.payload.userId }, { expiresIn: '10s'});
    const refreshToken = await this.jwtService.sign({ userId: command.payload.userId, deviceId: command.payload.deviceId })

    const payload = await this.jwtService.verify(refreshToken, { secret: 'jwt-secret' })
    const iatDate = new Date(payload.iat * 1000).toISOString()
    const expDate = new Date(payload.exp * 1000).toISOString()

    const session: SessionDocument | null = await this.authSessionModel.findOne({ device_id: payload.deviceId });
    if(!session) return null

    session.iat = iatDate
    session.exp = expDate
    await session.save()

    return {
      accessToken,
      refreshToken
    };
  }

}