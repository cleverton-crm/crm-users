import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Core } from 'core-types';

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

  @MessagePattern('user:update')
  async updateUser(updateData: User.Params.UpdatedData) {
    const js = {
      pattern: 'user:create',
      data: { id: 'ce51ebd3-32b1-4ae6-b7ef-e018126c4cc4' },
    };
    return await this.userService.updateUser(
      updateData.userId,
      updateData.data,
    );
  }

  @MessagePattern('user:list')
  async findAllUsers(): Promise<User.Response.UserData[]> {
    return await this.userService.findAllUsers();
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
}
