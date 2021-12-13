import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserModel, Users } from './schemas/user.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  BAD_REQUEST,
  EMAIL_NOT_FOUND,
  EMAIL_OR_PASSWORD_INCORRECT,
  EMAIL_USER_CONFLICT,
  USER_NOT_FOUND,
} from './exceptions/user.exception';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from './config/config.service';
import { Core } from 'core-types';
import { ClientProxy } from '@nestjs/microservices';
import { Roles, RolesModel } from './schemas/roles.schema';

/**
 * @class UserService
 */
@Injectable()
export class UserService {
  private readonly userModel: UserModel<Users>;
  private readonly rolesModel: RolesModel<Roles>;
  private logger = new Logger(UserService.name);

  constructor(
    @Inject('MAILER_SERVICE') private readonly mailerServiceClient: ClientProxy,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.userModel = this.connection.model('User') as UserModel<Users>;
    this.rolesModel = this.connection.model('Role') as RolesModel<Roles>;
  }

  /**
   * Sign up for User
   * @param {User.Params.CreateData} signUpUser - Data to sign up user in system
   */
  async registration(
    signUpUser: User.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.BadRequest> {
    let result;
    const user = new this.userModel(signUpUser);
    const role = await this.rolesModel.findOne({ name: 'Guest' });
    try {
      const tokenVerify = this.jwtService.sign(
        { email: user.email },
        { expiresIn: '3d' },
      );
      user.verification = tokenVerify;
      user.roles.push(role);
      await user.save();

      this.mailerServiceClient.emit('mail:send', {
        email: user.email,
        token: tokenVerify,
      });
      result = {
        statusCode: HttpStatus.OK,
        message: 'Аккаунт успешно создан. ',
      };
      this.logger.log('Create new user');
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
   * Login for users.
   * After successful login, generating token to get access
   * @param {User.Params.CreateData} loginData - Entered data by user
   */
  async login(loginData: User.Params.CreateData) {
    let result;

    try {
      const user = await this.findOneUserByEmail(loginData);
      await this.comparePassword(loginData, user);
      const token = await this.generateToken(user);
      console.log(token);
      await this.saveToken(user.email, token);
      result = {
        statusCode: HttpStatus.OK,
        token: token,
      };
    } catch (e) {
      result = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: e.message,
        errors: BAD_REQUEST,
      };
    }
    return result;
  }

  /**
   * Comparing password from user and database.
   * @param {User.Params.CreateData} enteredData - Entered data by user
   * @param {User} dbData - User's data from DB
   */
  async comparePassword(
    enteredData: User.Params.CreateData,
    dbData: Users,
  ): Promise<boolean | Core.Response.BadRequest> {
    const passwordVerify = await bcrypt.compare(
      enteredData.password,
      dbData.password,
    );
    if (dbData && passwordVerify) {
      return true;
    } else {
      throw new BadRequestException(EMAIL_OR_PASSWORD_INCORRECT);
    }
  }

  /**
   * Block login for user if he tried to login >= 5 times
   * @param user
   */
  // async blockUser(user) {
  //   user.blockExpires = addHours(new Date(), 1);
  //   await user.save();
  // }

  /**
   * Create user
   * @param {User.Params.CreateData} createUser - data for create user
   * @return ({Promise<User.Response.Success | User.Response.BadRequest>})
   */
  async createUser(
    createUser: User.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.BadRequest> {
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
   * Update User's data
   * @param {String} id
   * @param updateData
   */
  async updateUser(
    id: string,
    updateData: User.Params.PasswordData,
  ): Promise<Core.Response.Success | Core.Response.NotFound> {
    const user = await this.userModel
      .findOneAndUpdate({ _id: id }, updateData)
      .exec();
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }
    return Core.ResponseSuccessData('User data updated');
  }

  /**
   * List of all users in db
   */
  async findAllUsers(): Promise<User.Response.UserData[]> {
    return await this.userModel.find().exec();
  }

  /**
   * Find User in DB by his email
   * @param {User.Params.EmailData} emailEntered - Find if user with entered email exists
   */
  private async findOneUserByEmail(emailEntered: User.Params.EmailData) {
    const user = await this.userModel.findOne({ email: emailEntered.email });
    if (!user) {
      throw new NotFoundException(EMAIL_NOT_FOUND);
    }
    return user;
  }

  /**
   * Generating token for access in system
   * @param {User} user
   */
  private async generateToken(user: Users): Promise<any> {
    const payload = this.payLoad(user);
    const access = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt_access'),
    });

    const refresh = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt_refresh'),
    });
    this.logger.debug(
      `Generated token for user ${user.email} [${new Date()}]`,
      UserService.name,
    );
    return { access: access, refresh: refresh };
  }

  private payLoad(user: Users) {
    const rolesName = [];
    user.roles.forEach((value: any, index: number) => {
      rolesName.push({ name: value.name });
    });
    return {
      email: user.email,
      roles: rolesName,
    };
  }

  /**
   * Saving token for User in db
   * @param {String} email
   * @param {Token.Authorization} token
   */
  async saveToken(email: string, token: any): Promise<void> {
    await this.userModel.findOneAndUpdate(
      { email: email },
      {
        refreshToken: token.refresh,
        accessToken: token.access,
      },
    );
  }

  async emailVerify(
    verifyKey: string,
  ): Promise<
    Core.Response.Success | Core.Response.BadRequest | Core.Response.NotFound
  > {
    let result;
    if (!this.jwtService.verify(verifyKey)) {
      result = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Токен устарел',
        errors: 'Bad Request',
      };
    }
    const user = await this.userModel.findOne({ verification: verifyKey });
    if (user) {
      user.isVerify = true;
      await user.save();
      result = {
        statusCode: HttpStatus.OK,
        message: 'Ваш аккаунт был подтвержден',
      };
    } else {
      result = {
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_NOT_FOUND,
        errors: 'User not found',
      };
    }
    return result;
  }

  async forgotPassword(email: User.Params.EmailData) {
    await this.findOneUserByEmail(email);
  }
}
