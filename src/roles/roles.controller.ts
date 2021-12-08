import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { User } from 'core-types/user';
import { Core } from 'core-types/global';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern('roles:create')
  async createRole(
    roleData: User.Roles.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.BadRequest> {
    return await this.rolesService.createRole(roleData);
  }
}
