import { Transport } from '@nestjs/microservices';

export class ConfigService {
  private readonly config: { [key: string]: any } = null;

  constructor() {
    this.config = {
      port: process.env.USER_SERVICE_PORT,
      jwt_secret: process.env.JWT_SECRET || 'i_dont_not_use_secret_key',
      jwt_access: process.env.JWT_ACCESS_EXP || '1m',
      jwt_refresh: process.env.JWT_REFRESH_EXP || '2m',
    };
    this.config.baseUrl = process.env.BASE_URL;
    this.config.gatewayPort = process.env.API_GATEWAY_PORT;
    this.config.mailerService = {
      options: {
        port: process.env.MAILER_SERVICE_PORT,
        host: process.env.MAILER_SERVICE_HOST,
      },
      transport: Transport.TCP,
    };
  }

  get(key: string): any {
    return this.config[key];
  }
}
