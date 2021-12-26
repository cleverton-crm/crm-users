import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TcpOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { cyan } from 'cli-color';
import { ConfigService } from './config/config.service';
require('dotenv').config();

async function bootstrap() {
  const logger = new Logger('UserModule');
  const config = new ConfigService();
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: config.get('port'),
    },
  } as TcpOptions);

  logger.log(
    cyan(`User microservices start on port TCP:${config.get('port')}`),
  );
  await app.listen();
}
bootstrap();
