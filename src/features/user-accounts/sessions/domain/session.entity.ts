import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { CreateSessionDto } from '../api/input/create-session.dto';


@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class AuthSession {
  @Prop({ type: String, required: true })
  user_id: string;
  @Prop({ type: String, required: true })
  device_id: string;
  @Prop({ type: String, required: true })
  iat: string;
  @Prop({ type: String, required: true })
  device_name: string;
  @Prop({ type: String, required: true })
  ip: string;
  @Prop({ type: String, required: true })
  exp: string;

  constructor(dto: {
    device_id: string;
    user_id: string;
    ip: string;
    exp: string;
    iat: string;
    device: string;
  }) {
    this.user_id = dto.user_id;
    this.device_id = dto.device_id;
    this.iat = dto.iat;
    this.device_name = dto.device;
    this.ip = dto.ip;
    this.exp = dto.exp;
  }
}
export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);
export type SessionDocument = HydratedDocument<AuthSession>
export type AuthSessionType = Model<SessionDocument> & typeof AuthSession;





