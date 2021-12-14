import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from './providers/jwt.services';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoConfigService } from './providers/mongo.service';
import { ConfigService } from './config/config.service';
import { UserProvider } from './schemas/user.provider';
import { RolesProvider } from './schemas/roles.provider';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ForgotPasswordProvider } from './schemas/forgot.provider';

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
  ],
  exports: [ConfigService],
})
export class UserModule {}
