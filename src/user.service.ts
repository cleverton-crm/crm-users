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
  EMAIL_OR_PASSWORD_INCORRECT,
  EMAIL_USER_CONFLICT,
  RESET_PASSWORD_NOT_FOUND,
  USER_NOT_FOUND,
} from './exceptions/user.exception';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from './config/config.service';
import { Core } from 'core-types';
import { ClientProxy } from '@nestjs/microservices';
import { Roles, RolesModel } from './schemas/roles.schema';
import { ForgotPassword } from './schemas/forgot.schema';
import { addMinutes, differenceInMinutes } from 'date-fns';

/**
 * @class UserService
 */
@Injectable()
export class UserService {
  private readonly userModel: UserModel<Users>;
  private readonly rolesModel: RolesModel<Roles>;
  private readonly forgotPasswordModel;
  private logger = new Logger(UserService.name);
  private SEND_ATTEMPTS_MAX = 5;

  constructor(
    @Inject('MAILER_SERVICE') private readonly mailerServiceClient: ClientProxy,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.forgotPasswordModel = this.connection.model('ForgotPassword');
    this.userModel = this.connection.model('User') as UserModel<Users>;
    this.rolesModel = this.connection.model('Roles') as RolesModel<Roles>;
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
    const { email } = loginData;
    try {
      const user = (await this.findOneUserByEmail(email)) as Users;
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
  private async findOneUserByEmail(emailEntered: string) {
    const user = await this.userModel.findOne({ email: emailEntered }).exec();

    if (!user) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_NOT_FOUND,
        errors: 'Not Found',
      };
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

  /**
   * User verification email after registraion
   * @param {String} verifyKey
   */
  async emailVerify(
    verifyKey: string,
  ): Promise<
    Core.Response.Success | Core.Response.BadRequest | Core.Response.NotFound
  > {
    let result;
    try {
      if (!this.jwtService.verify(verifyKey)) {
        throw new BadRequestException('Токен устарел');
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
        throw new NotFoundException(USER_NOT_FOUND);
      }
    } catch (e) {
      result = {
        statusCode: e.status,
        message: e.message,
        errors: e.error,
      };
    }
    return result;
  }

  /**
   * Change password when user is sign in
   * @param {User.Password.ChangePassword} passwordData
   */
  async changePassword(
    passwordData: User.Password.ChangePassword,
  ): Promise<
    Core.Response.Success | Core.Response.NotFound | Core.Response.BadRequest
  > {
    let result;
    const user = await this.userModel
      .findOne({ email: passwordData.email, accessToken: passwordData.access })
      .exec();
    if (!user) {
      result = {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Попытка взлома',
        errors: 'Not Found',
      };
      // TODO: Отправить сообщение на почту
    }
    const passwordVerify = await bcrypt.compare(
      passwordData.password,
      user.password,
    );
    if (passwordVerify) {
      if (passwordData.password_new === passwordData.password_confirm) {
        user.password = passwordData.password_new;
        await user.save();
        result = {
          statusCode: HttpStatus.OK,
          message: 'Пароль был успешно изменен',
        };
      } else {
        result = {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'Пароль не изменён, так как новый пароль повторен неправильно.',
          errors: 'Bad Request',
        };
      }
    } else {
      result = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Не неправильно указан старый пароль',
        errors: 'Bad Request',
      };
    }
    console.log('TEST', passwordVerify);
    return result;
  }

  /**
   * Send email to reset password
   * @param {Core.Geo.LocationEmail} data - User's location info
   */
  async forgotPassword(data: Core.Geo.LocationEmail) {
    const { email } = data;
    let result;
    const user = (await this.findOneUserByEmail(email)) as Users;
    try {
      const forgot = await this.forgotPasswordModel.create({
        email: user.email,
      });
      const tokenVerify = this.jwtService.sign(
        { email: user.email },
        { expiresIn: '12h' },
      );
      forgot.verificationKey = tokenVerify;
      delete data.email;
      forgot.location.set(Date.now().toString(), data);
      await forgot.save();
      this.mailerServiceClient.emit('mail:forgotpassword', {
        email: user.email,
        token: tokenVerify,
      });
      result = {
        statusCode: HttpStatus.OK,
        message:
          'Вам отправлено письмо на указанную электронную почту для сброса пароля',
      };
    } catch (e) {
      result = {
        statusCode: HttpStatus.CONFLICT,
        message:
          'На указанную почту уже было отправлено письмо для восстановления пароля',
        errors: 'Conflict',
      };
    }
    return result;
  }

  /**
   * Повторная отправка сообщения на почту для восстановления пароля
   * @param {Core.Geo.LocationEmail} data - Информация о локации пользователя
   */
  async refreshPasswordVerify(data: Core.Geo.LocationEmail) {
    const { email } = data;
    let result;
    try {
      const guest = await this.forgotPasswordModel
        .findOne({ email: email })
        .exec();
      if (!guest) {
        throw new NotFoundException(RESET_PASSWORD_NOT_FOUND);
      }
      if (guest.sendAttempts >= this.SEND_ATTEMPTS_MAX) {
        throw new BadRequestException(
          `Извините, превышено количество запросов на восстановление пароля. Максимум ${this.SEND_ATTEMPTS_MAX} попыток`,
        );
      } else {
        guest.sendAttempts += 1;
        if (guest.refreshDate === null) {
          guest.refreshDate = new Date();
        }
        if (guest.refreshDate > new Date()) {
          throw new BadRequestException(
            `Подождите ${differenceInMinutes(
              guest.refreshDate,
              new Date(),
            )} минут. Попыток ${guest.sendAttempts} из ${
              this.SEND_ATTEMPTS_MAX
            }`,
          );
        } else {
          guest.refreshDate = addMinutes(guest.refreshDate, guest.timeout);
          guest.timeout += 3;

          await guest.save();

          this.mailerServiceClient.emit('mail:forgotpassword', {
            email: guest.email,
            token: guest.verificationKey,
          });
          result = {
            statusCode: HttpStatus.OK,
            message: `Сообщение на сброс пароля было повторно отправлено. Попыток ${guest.sendAttempts} из ${this.SEND_ATTEMPTS_MAX}`,
          };
        }
      }
    } catch (e) {
      result = {
        statusCode: e.status,
        message: e.message,
        errors: e.error,
      };
    }
    return result;
  }

  async forgotVerify() {}
}
