export class ConfigService {
  private readonly config: { [key: string]: any } = null;

  constructor() {
    this.config = {
      port: process.env.USER_SERVICE_PORT,
    };
    this.config.baseUri = process.env.BASE_URI;
    this.config.gatewayPort = process.env.API_GATEWAY_PORT;
  }

  get(key: string): any {
    return this.config[key];
  }
}
