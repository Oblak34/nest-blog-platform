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
}
