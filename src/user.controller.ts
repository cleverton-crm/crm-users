import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Core } from 'crm-core';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user:register')
  async registerUser(
    userData: User.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.BadRequest> {
    return await this.userService.registration(userData);
  }

  @MessagePattern('user:login')
  async loginUser(userData: User.Params.CreateData) {
    return await this.userService.login(userData);
  }

  @MessagePattern('user:create')
  async createUser(
    userData: User.Params.CreateData,
  ): Promise<Core.Response.Success | Core.Response.BadRequest> {
    return await this.userService.createUser(userData);
  }

  @MessagePattern('user:list')
  async findAllUsers(): Promise<User.Response.UserData[]> {
    return await this.userService.findAllUsers();
  }

  @MessagePattern('user:archive')
  async archiveUser(@Payload() archiveData: User.Params.ArchiveData) {
    return await this.userService.archiveUser(archiveData);
  }

  @MessagePattern('user:verify')
  async emailVerify(
    @Payload() secretKey: string,
  ): Promise<
    Core.Response.Success | Core.Response.BadRequest | Core.Response.NotFound
  > {
    return await this.userService.emailVerify(secretKey);
  }

  @MessagePattern('password:change')
  async changePassword(
    @Payload() passwords: User.Password.ChangePassword,
  ): Promise<
    Core.Response.Success | Core.Response.NotFound | Core.Response.BadRequest
  > {
    return await this.userService.changePassword(passwords);
  }

  @MessagePattern('password:forgot')
  async forgotPassword(@Payload() email: Core.Geo.LocationEmail) {
    return await this.userService.forgotPassword(email);
  }

  @MessagePattern('password:refreshverify')
  async refreshPasswordVerify(@Payload() email: Core.Geo.LocationEmail) {
    return await this.userService.refreshPasswordVerify(email);
  }

  @MessagePattern('password:forgotverify')
  async forgotVerify(@Payload() userData: User.Params.VerificationLink) {
    return await this.userService.forgotVerify(userData);
  }

  @MessagePattern('password:reset')
  async resetPassword(@Payload() userData: User.Password.ResetPassword) {
    return await this.userService.resetPassword(userData);
  }
}
