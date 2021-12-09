import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Roles, RolesModel } from '../schemas/roles.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ROLE_NAME_CONFLICT } from '../exceptions/roles.exception';
import { cyan, red } from 'cli-color';
import { Core } from 'core-types/global';

@Injectable()
export class RolesService {
  private readonly roleModel: RolesModel<Roles>;
  private logger = new Logger(RolesService.name);

  constructor(@InjectConnection() private connection: Connection) {
    this.roleModel = this.connection.model('Roles') as RolesModel<Roles>;
  }

  /**
   * Creating Role for User
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
}
