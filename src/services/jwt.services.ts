import { JwtOptionsFactory, JwtModuleOptions } from '@nestjs/jwt';
export class JwtConfigService implements JwtOptionsFactory {
  createJwtOptions(): JwtModuleOptions {
    return {
      secret: process.env.JWT_SECRET || 'i_dont_not_use_secret_key',
    };
  }
}
