import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolesService } from './roles.service';
import { Core } from 'crm-core';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern('roles:create')
  async createRole(
    roleData: User.Roles.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.BadRequest> {
    return await this.rolesService.createRole(roleData);
  }

  @MessagePattern('roles:update')
  async updateRole(@Payload() roleData: User.Roles.Params.UpdateData) {
    return await this.rolesService.updateRole(roleData);
  }

  @MessagePattern('roles:list')
  async findAllRoles(): Promise<User.Response.RolesData[]> {
    return await this.rolesService.findAllRoles();
  }
}
