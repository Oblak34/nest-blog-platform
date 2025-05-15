import { Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ExtractRefreshFromCookie } from '../../guards/decorators/param/extract-user-from-request';
import { RefreshTokenPayloadDto } from '../../auth/api/input/refreshTokenPayload.dto';
import { GetAllDevicesUseCaseCommand } from '../application/use-cases/get-all-devices.use-case';
import { AuthGuardRefresh } from '../../../../core/guard/checkRefreshToken';
import { DeleteAllDevicesUseCaseCommand } from '../application/use-cases/delete-all-devices.use-case';
import { DeleteDevicesByIdUseCaseCommand } from '../application/use-cases/delete-device-by-id.use-case';

@Controller('security')
export class SessionController {
  constructor(private commandBus: CommandBus) {}

  @UseGuards(AuthGuardRefresh)
  @Get('devices')
  async getAllDevices(@ExtractRefreshFromCookie() payload: RefreshTokenPayloadDto){
    return await this.commandBus.execute(new GetAllDevicesUseCaseCommand(payload))
  }

  @UseGuards(AuthGuardRefresh)
  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDevices(@ExtractRefreshFromCookie() payload: RefreshTokenPayloadDto){
    return await this.commandBus.execute(new DeleteAllDevicesUseCaseCommand(payload))
  }

  @UseGuards(AuthGuardRefresh)
  @Delete('devices/:securityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDeviceById(@ExtractRefreshFromCookie() payload: RefreshTokenPayloadDto, @Param('securityId') id: string){
    return await this.commandBus.execute(new DeleteDevicesByIdUseCaseCommand(payload, id))
  }
}