import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @MessagePattern('roles:create')
  async createRole(
    roleData: User.Roles.Params.CreateData,
  ): Promise<User.Response.Success | User.Response.BadRequest> {
    return await this.rolesService.createRole(roleData);
  }
}
