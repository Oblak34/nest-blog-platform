import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDto } from '../api/input/create-user.dto';
import { UserViewDto } from '../api/output/user-view.dto';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};
export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};


@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class User {
  @Prop({ type: String, required: true, ...loginConstraints })
  login: string;
  @Prop({ type: String, required: true })
  password: string;
  @Prop({ type: String, required: true })
  email: string;
  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('User not found');
    }
    this.deletedAt = new Date();
  }

  static createInstance(dto: CreateUserDto): UserDocument {
    const user = new this();
    user.login = dto.login;
    user.password = dto.password;
    user.email = dto.email;
    return user as UserDocument;
  }

  static convertToView(user: UserDocument): UserViewDto {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);
export type UserDocument = HydratedDocument<User>;
export type UserModelType = Model<UserDocument> & typeof User;
