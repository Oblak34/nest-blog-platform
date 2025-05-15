import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}
  async findById(id: string) {
    return this.UserModel.findOne({ _id: id, deletedAt: null });
  }
  async save(user: UserDocument) {
    await user.save();
  }
  async findByEmail(email: string){
    return await this.UserModel.findOne({'accountData.email': email})
  }
  async findByCode(code: string){
    return await this.UserModel.findOne({'emailConfirmation.confirmationCode' : code})
  }
  async findByRecoveryCode(code: string){
    return await this.UserModel.findOne({'emailConfirmation.passwordRecoveryCode' : code})
  }
  async findByLoginAndEmail(email: string, login: string){
    return this.UserModel.findOne({ $or: [{ 'accountData.login': login }, { 'accountData.email': email }] });
  }
  async findByLoginOrEmail(loginOrEmail: string){
    return this.UserModel.findOne({ $or: [{ 'accountData.login': loginOrEmail }, { 'accountData.email': loginOrEmail }] });
  }
}
