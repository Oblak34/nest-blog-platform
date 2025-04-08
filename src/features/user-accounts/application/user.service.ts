import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../api/input/create-user.dto';
import { UserRepository } from '../infrastructure/user.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import {v4 as uuidv4} from "uuid";
import { AuthConfig } from '../config/auth.config';
import { ExpDate } from '../domain/dto/expDate';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private userRepository: UserRepository,
    private authConfig: AuthConfig,
  ) {}
  async createUser(dto: CreateUserDto) {
    console.log('dto ', dto)

    const confirmCode = crypto.randomUUID()
    console.log('confirmCode ', confirmCode)

    const expDate: ExpDate = this.authConfig.expirationDate
    console.log('expDate ', expDate)

    const user =  new User(dto, confirmCode, expDate)

    const newUser: UserDocument =  await this.UserModel.create(user)
    await this.userRepository.save(newUser);
    return newUser._id.toString();
  }
  async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    user.makeDeleted();
    await this.userRepository.save(user);
    return true;
  }
}
