export class CreateSessionDto {
  user_id: string
  ip: string
  iat: Date
  exp: Date
  device: string
  device_id: string
}