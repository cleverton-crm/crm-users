import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User, UserModel } from './schemas/user.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  EMAIL_USER_CONFLICT,
  USER_NOT_FOUND,
} from './exceptions/user.exception';
import { ResponseSuccessData } from './helpers/global';

@Injectable()
export class UserService {
  private userModel: UserModel<User>;
  private logger = new Logger(UserService.name);

  constructor(
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
  ) {
    this.userModel = this.connection.model('User') as UserModel<User>;
  }

  /**
   * Sign up for User
   * @param {User.Params.CreateData} signUpUser - Data to sign up user in system
   */
  async regUser(
    signUpUser: User.Params.CreateData,
  ): Promise<User.Response.Success | User.Response.BadRequest> {
    let result;

    const user = new this.userModel(signUpUser);

    try {
      await user.save();
      result = {
        statusCode: HttpStatus.OK,
        message: 'Пользователь был создан',
      };
    } catch (e) {
      result = {
        statusCode: HttpStatus.CONFLICT,
        message: EMAIL_USER_CONFLICT,
        errors: 'Conflict',
      };
    }
    return result;
  }

  /**
   * Create user
   * @param {User.Params.CreateData} createUser - data for create user
   * @return ({Promise<User.Response.Success | User.Response.BadRequest>})
   */
  async createUser(
    createUser: User.Params.CreateData,
  ): Promise<User.Response.Success | User.Response.BadRequest> {
    let result;

    const user = new this.userModel(createUser);

    try {
      await user.save();
      result = {
        statusCode: HttpStatus.OK,
        message: 'Пользователь был создан',
      };
    } catch (e) {
      result = {
        statusCode: HttpStatus.CONFLICT,
        message: EMAIL_USER_CONFLICT,
        errors: 'Conflict',
      };
    }
    return result;
  }

  /**
   * Update User Data
   * @param {String} id
   * @param updateData
   */
  async updateUser(
    id: string,
    updateData: User.Params.PasswordData,
  ): Promise<User.Response.Success | User.Response.NotFound> {
    const user = await this.userModel
      .findOneAndUpdate({ _id: id }, updateData)
      .exec();
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }
    return ResponseSuccessData('User data updated');
  }

  async findAllUsers(): Promise<User.Response.UserData[]> {
    return await this.userModel.find().exec();
  }
}
