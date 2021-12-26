import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';
import { JwtModule } from '@nestjs/jwt';

import { MongooseModule } from '@nestjs/mongoose';

import { ConfigService } from './config/config.service';

import { ClientProxyFactory } from '@nestjs/microservices';

import {
  ForgotPasswordProvider,
  ProfileProvider,
  RolesProvider,
  UserProvider,
} from './providers';
import { JwtConfigService, MongoConfigService, UserService } from './services';
import { UserController } from './controllers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      useClass: JwtConfigService,
    }),
    MongooseModule.forRootAsync({
      useClass: MongoConfigService,
    }),
    MongooseModule.forFeatureAsync([
      UserProvider,
      RolesProvider,
      ForgotPasswordProvider,
      ProfileProvider,
    ]),
  ],
  controllers: [UserController, RolesController],
  providers: [
    ConfigService,
    UserService,
    RolesService,
    {
      provide: 'MAILER_SERVICE',
      useFactory: (configService: ConfigService) => {
        const mailerServiceOptions = configService.get('mailerService');
        return ClientProxyFactory.create(mailerServiceOptions);
      },
      inject: [ConfigService],
    },
    {
      provide: 'PROFILE_SERVICE',
      useFactory: (configService: ConfigService) => {
        const profileServiceOptions = configService.get('profileService');
        return ClientProxyFactory.create(profileServiceOptions);
      },
      inject: [ConfigService],
    },
  ],
  exports: [ConfigService],
})
export class AppModule {}
