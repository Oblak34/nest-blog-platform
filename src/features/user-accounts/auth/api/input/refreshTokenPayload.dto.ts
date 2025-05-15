export class RefreshTokenPayloadDto {
  userId: string
  deviceId: string
  iat: Date
  exp: Date
}