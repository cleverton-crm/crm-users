export class ConfigService {
  private readonly config: { [key: string]: any } = null;

  constructor() {
    this.config = {
      port: process.env.USER_SERVICE_PORT,
      jwt_secret: process.env.JWT_SECRET || 'i_dont_not_use_secret_key',
      jwt_access: process.env.JWT_ACCESS_EXP || '1m',
      jwt_refresh: process.env.JWT_REFRESH_EXP || '2m',
    };
    this.config.baseUri = process.env.BASE_URI;
    this.config.gatewayPort = process.env.API_GATEWAY_PORT;
  }

  get(key: string): any {
    return this.config[key];
  }
}
