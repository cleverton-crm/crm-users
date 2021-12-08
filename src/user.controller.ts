import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user:register')
  async registerUser(
    userData: User.Params.CreateData,
  ): Promise<User.Response.Success | User.Response.BadRequest> {
    return await this.userService.registration(userData);
  }

  @MessagePattern('user:login')
  async loginUser(userData: User.Params.CreateData) {
    return await this.userService.login(userData);
  }

  @MessagePattern('user:create')
  async createUser(
    userData: User.Params.CreateData,
  ): Promise<User.Response.Success | User.Response.BadRequest> {
    console.log('TEST', userData);
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
}
