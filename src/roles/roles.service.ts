import {HttpStatus, Injectable, Logger, NotFoundException,} from '@nestjs/common';
import {Roles, RolesModel} from '../schemas/roles.schema';
import {InjectConnection} from '@nestjs/mongoose';
import {Connection} from 'mongoose';
import {ROLE_NAME_CONFLICT, ROLE_NOT_FOUND,} from '../exceptions/roles.exception';
import {cyan, red} from 'cli-color';
import {Core} from 'crm-core';
import {ResponseSuccessData} from '../helpers/global';

@Injectable()
export class RolesService {
  private readonly roleModel: RolesModel<Roles>;
  private logger = new Logger(RolesService.name);

  constructor(@InjectConnection() private connection: Connection) {
    this.roleModel = this.connection.model('Roles') as RolesModel<Roles>;
  }

  /**
   * Создание роли для пользователей
   * @param {User.Roles.Params.CreateData} createRole - Data for creating role
   * @return ({Promise<User.Response.Success | User.Response.BadRequest>})
   */
  async createRole(
    createRole: User.Roles.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.BadRequest> {
    let result;

    const role = new this.roleModel(createRole);

    try {
      await role.save();
      result = {
        statusCode: HttpStatus.OK,
        message: 'Роль была создана',
      };
      this.logger.log(cyan(JSON.stringify(result)));
    } catch (e) {
      result = {
        statusCode: HttpStatus.CONFLICT,
        message: ROLE_NAME_CONFLICT,
        errors: 'Conflict',
      };
      this.logger.error(red(JSON.stringify(result)));
    }

    return result;
  }

  /**
   * Изменение данных роли
   * @param {User.Roles.Params.UpdateData} roleData
   */
  async updateRole(roleData: User.Roles.Params.UpdateData) {
    const role = await this.roleModel
      .findOneAndUpdate({ _id: roleData.id }, roleData)
      .exec();
    console.log(role);
    if (!role) {
      throw new NotFoundException(ROLE_NOT_FOUND);
    }
    return ResponseSuccessData('Role data updated');
  }

  /**
   * Список всех ролей
   */
  async findAllRoles(): Promise<User.Response.RolesData[]> {
    let result;
    try {
      result = {
        statusCode: HttpStatus.OK,
        message: 'Roles List',
        data: await this.roleModel.find().exec(),
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
}
