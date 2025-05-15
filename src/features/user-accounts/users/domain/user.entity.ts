import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateUserDto } from '../api/input/create-user.dto';
import { UserViewDto } from '../api/output/user-view.dto';
import bcrypt from "bcrypt";
import {add} from "date-fns/add";
import { ExpDate } from '../../auth/domain/expDate';


@Schema()
export class AccountData {
  @Prop({type: String, required: true})
  login: string;
  @Prop({type: String, required: true})
  hashPassword: string;
  @Prop({type: String, required: true})
  email: string;
  @Prop({ type: Date, nullable: true, default: null, required: true })
  createdAt: string;
}
export const AccountDataSchema = SchemaFactory.createForClass(AccountData);

@Schema()
export class EmailConfirmation {
  @Prop({type: String, required: true})
  confirmationCode: string;
  @Prop({type: Date, required: true})
  expirationDate: Date;

  @Prop({type: Boolean, required: true})
  isConfirmed: boolean | null;
  @Prop({ type: String, default: null })
  passwordRecoveryCode: string | null;
}
export const EmailConfirmationSchema = SchemaFactory.createForClass(EmailConfirmation)

@Schema()
export class User {
  @Prop({ type: AccountDataSchema, required: true, _id: false })
  accountData: AccountData;

  @Prop({ type: EmailConfirmationSchema, required: true, _id: false})
  emailConfirmation: EmailConfirmation
  
  @Prop({ type: Date, nullable: true, default: null })
  deletedAt: Date

  constructor(dto: CreateUserDto, code: string, expDate: ExpDate) {
    this.accountData =  {
      login: dto.login,
      email: dto.email,
      hashPassword: this._createHash(dto.password),
      createdAt: new Date().toISOString()
    }
    this.emailConfirmation = {
      confirmationCode: code,
      expirationDate: add(new Date(), expDate),
      isConfirmed: false,
      passwordRecoveryCode: code ? code : null
    }
 }

  private _createHash(password:string):string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('User not found');
    }
    this.deletedAt = new Date();
  }

  setConfirmationCode(confirmCode: string) {
    this.emailConfirmation.confirmationCode = confirmCode
  }


  static convertToView(user: UserDocument): UserViewDto {
    return {
      id: user.id,
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt
    };
  }
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.loadClass(User);
export type UserDocument = HydratedDocument<User>;
export type UserModelType = Model<UserDocument> & typeof User;
