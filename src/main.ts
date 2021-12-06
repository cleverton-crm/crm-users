import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { TcpOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { cyan } from 'cli-color';
require('dotenv').config();

async function bootstrap() {
  const logger = new Logger('UserModule');
  const PORT = process.env.USER_SERVICE_PORT || 4001;
  const app = await NestFactory.createMicroservice(UserModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: PORT,
    },
  } as TcpOptions);
  logger.log(cyan(`User microservices start on port TCP:${PORT}`));
  await app.listen();
}
bootstrap();
