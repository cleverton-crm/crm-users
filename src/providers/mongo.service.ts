import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { getBoolean } from '../helpers/global';

export class MongoConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    let urlMongo;
    const auth = process.env.MONGO_ENABLE;
    const user = process.env.MONGO_ROOT_USER;
    const password = process.env.MONGO_ROOT_PASSWORD;
    const host = process.env.MONGO_HOST;
    const base = process.env.MONGO_DATABASE;
    const port = process.env.MONGO_PORT;

    urlMongo = `mongodb://${user}:${password}@${host}:${port}/${base}?authSource=admin`;

    return {
      uri: urlMongo,
    };
  }
}
