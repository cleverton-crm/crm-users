import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserModel, Users } from '../schemas/user.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  BAD_REQUEST,
  EMAIL_OR_PASSWORD_INCORRECT,
  EMAIL_USER_CONFLICT,
  NOT_FOUND,
  RESET_PASSWORD_NOT_FOUND,
  USER_NOT_FOUND,
} from '../exceptions/user.exception';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '../config/config.service';
import { Core } from 'crm-core';
import { ClientProxy } from '@nestjs/microservices';
import { Roles, RolesModel } from '../schemas/roles.schema';
import { ForgotPassword } from '../schemas/forgot.schema';
import { addMinutes, differenceInMinutes } from 'date-fns';
import { firstValueFrom } from 'rxjs';

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
    @Inject('MAILER_SERVICE')
    private readonly mailerServiceClient: ClientProxy,
    @Inject('PROFILE_SERVICE')
    private readonly profileServiceClient: ClientProxy,
    @InjectConnection() private connection: Connection,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.forgotPasswordModel = this.connection.model('ForgotPassword');
    this.userModel = this.connection.model('User') as UserModel<Users>;
    this.rolesModel = this.connection.model('Roles') as RolesModel<Roles>;
  }

  /**
   * Регистрация пользователя
   * @param {User.Params.CreateData} signUpUser - Введенные данные для регистрации
   */
  async registration(
    signUpUser: User.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.Error> {
    let result, roleName;
    const user = new this.userModel(signUpUser);
    if (signUpUser.isAdmin) {
      roleName = 'Admin';
    } else {
      roleName = 'Member';
    }
    const role = await this.rolesModel.findOne({ name: roleName });
    try {
      const tokenVerify = this.jwtService.sign(
        { email: user.email },
        { expiresIn: '3d' },
      );
      user.permissions = roleName;
      user.verification = tokenVerify;
      user.roles.push(role);
      await user.save();

      this.profileServiceClient.emit('profile:new', {
        email: user.email,
        owner: user._id,
      });

      this.mailerServiceClient.emit('mail:send', {
        email: user.email,
        token: tokenVerify,
      });

      result = {
        statusCode: HttpStatus.OK,
        message:
          'Поздравляем! Аккаунт успешно зарегистрирован. Активируйте ссылка на указанном вами email!',
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
   * Логин пользователя.
   * После успешного логина, генерируется токен для входа
   * @param {User.Params.CreateData} loginData - Введенные данные для логина
   */
  async login(loginData: User.Params.CreateData) {
    let result;
    const { email } = loginData;
    try {
      const user = (await this.findOneUserByEmail(email)) as Users;
      const profile = await firstValueFrom(
        this.profileServiceClient.send('profile:get:id', {
          owner: user._id,
        }),
      );

      await this.comparePassword(loginData, user);
      const token = await this.generateToken(user, profile.id);
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
   * Сравнение паролей
   * @param {User.Params.CreateData} enteredData - Введенные данные
   * @param {User} dbData - Данные в бд
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
   * Лист всех пользователей
   */
  async findAllUsers(): Promise<User.Response.UserData[]> {
    let result;
    try {
      result = {
        statusCode: HttpStatus.OK,
        message: 'User List',
        data: await this.userModel.find().exec(),
      };
    } catch (e) {
      result = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: e.message,
        errors: e.error,
      };
    }
    return result;
  }

  /**
   * Поиск пользователя по электронной почте
   * @param {User.Params.EmailData} emailEntered
   */
  private async findOneUserByEmail(emailEntered: string) {
    const user = await this.userModel
      .findOne({ email: emailEntered, active: true })
      .exec();
    if (!user) {
      throw new Error(USER_NOT_FOUND);
    }
    return user;
  }

  async archiveUser(archiveData: User.Params.ArchiveData) {
    let result;
    const { request } = archiveData;
    const user = await this.userModel.findOne({ _id: archiveData.id });
    if (user) {
      console.log(request);
      if (request.email === user.email) {
        result = {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Невозможно себя заблокировать или разблокировать',
        };
      } else {
        user.active = archiveData.active;
        await user.save();
        if (!user.active) {
          result = {
            statusCode: HttpStatus.OK,
            message: 'Аккаунт пользователя успешно заблокирован',
          };
        } else {
          result = {
            statusCode: HttpStatus.OK,
            message: 'Аккаунт пользователя успешно разблокирован',
          };
        }
      }
    } else {
      result = {
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_NOT_FOUND,
        errors: NOT_FOUND,
      };
    }
    return result;
  }

  /**
   * Генерация токена для доступа в систему
   * @param {User} user
   * @param pid
   */
  private async generateToken(user: Users, pid: string): Promise<any> {
    const payload = this.payLoad(user, pid);
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

  private payLoad(user: Users, pid: string) {
    const rolesName = [];
    user.roles.forEach((value: any, index: number) => {
      rolesName.push({ name: value.name });
    });
    return {
      userID: pid,
      email: user.email,
      roles: rolesName,
    };
  }

  /**
   * Сохранение токена в базе
   * @param {String} email
   * @param {Token.Authorization} token
   */
  private async saveToken(email: string, token: any): Promise<void> {
    await this.userModel.findOneAndUpdate(
      { email: email },
      {
        refreshToken: token.refresh,
        accessToken: token.access,
      },
    );
  }

  /**
   * Верификация аккаунта после регистрации пользователя
   * @param {String} verifyKey - Верификационный ключ
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
   * Изменение пароля пользователем
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
          message: 'Пароль не изменён, так как пароли не совпадают.',
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
   * Отправка сообщения на почту для сброса пароля
   * @param {Core.Geo.LocationEmail} data - Информация о локации пользователя
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

  /**
   * Верификация пользователя по токену с почты для сброса пароля
   * @param {User.Params.VerificationLink} data - Токен для верификации
   */
  async forgotVerify(data: User.Params.VerificationLink) {
    let result;
    try {
      if (!this.jwtService.verify(data.verification)) {
        // throw new BadRequestException('Токен устарел');
        result = {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Неверный токен',
          errors: 'Bad Request',
        };
      } else {
        const password = await this.forgotPasswordModel.findOne({
          verificationKey: data.verification,
        });
        if (password.stepVerification) {
          throw new BadRequestException(
            'Верификация с почты для сброса пароля уже была пройдена ранее',
          );
        }
        if (password.stepReset) {
          throw new BadRequestException('Сброс пароля уже был произведен');
        }
        if (password) {
          password.stepVerification = true;
          await password.save();
          result = {
            statusCode: HttpStatus.OK,
            message: 'Верификация для сброса пароля успешно пройдена',
          };
        }
      }
    } catch (e) {
      if (e.name === 'JsonWebTokenError') {
        result = {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Неверный токен',
          errors: 'Bad Request',
        };
      } else {
        result = {
          statusCode: e.status,
          message: e.message,
          errors: e.error,
        };
      }
    }
    console.log(result);
    return result;
  }

  /**
   * Сброс пароля пользователя после успешной верификации
   * @param {User.Password.ResetPassword} data - Ввод нового пароля
   */
  async resetPassword(data: User.Password.ResetPassword) {
    let result;
    try {
      const forgotpassword = await this.forgotPasswordModel
        .findOne({ verificationKey: data.verificationKey })
        .exec();
      if (!forgotpassword.stepVerification) {
        throw new BadRequestException(
          'Верификация с почты для сброса пароля еще не была пройдена',
        );
      }
      if (forgotpassword.stepReset) {
        throw new BadRequestException('Сброс пароля уже был произведен');
      }
      if (forgotpassword) {
        if (data.password_new === data.password_confirm) {
          forgotpassword.stepReset = true;
          const hashpassword = await bcrypt.hash(data.password_new, 10);
          await this.userModel.findOneAndUpdate(
            { email: forgotpassword.email },
            { password: hashpassword },
          );
          result = {
            statusCode: HttpStatus.OK,
            message: 'Пароль был успешно изменен',
          };
        } else {
          throw new BadRequestException(
            'Пароль не изменён, так как пароли не совпадают',
          );
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

  /**
   * Получение нового токена
   * @param refreshToken
   */
  async refreshToken(refreshToken: User.Params.RefreshToken): Promise<any> {
    let result = {};
    const user = await this.userModel.findOne(refreshToken);
    const profile = await firstValueFrom(
      this.profileServiceClient.send('profile:get:id', {
        owner: user._id,
      }),
    );
    if (!user) {
      return (result = {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'User not authorized. Please try again.',
        errors: 'Unauthorized',
      });
    }
    try {
      const tokenOld = this.jwtService.verify(user.refreshToken);
      const tokenNew = await this.generateToken(user, profile.id);
      result = {
        statusCode: HttpStatus.OK,
        message: 'Congratulations! You has been refresh token',
        token: { access: tokenNew.access },
      };
    } catch (e) {
      result = {
        statusCode: e.status,
        message: e.message,
        errors: e.error,
      };
    }

    return result;
  }
}
