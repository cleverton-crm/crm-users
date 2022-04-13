import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';
import { Core } from 'crm-core';

export class MongoConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    let urlMongo;
    let mongoConnectionHosts = [];
    const replica = process.env.MONGO_REPLICA;
    const auth = process.env.MONGO_ENABLE;
    const user = process.env.MONGO_ROOT_USER;
    const password = process.env.MONGO_ROOT_PASSWORD;
    const base = process.env.MONGO_DATABASE;
    process.env.MONGO_HOST1 ? mongoConnectionHosts.push(`${process.env.MONGO_HOST1}:${process.env.MONGO_PORT1}`) : null;
    process.env.MONGO_HOST2 ? mongoConnectionHosts.push(`${process.env.MONGO_HOST2}:${process.env.MONGO_PORT2}`) : null;
    process.env.MONGO_HOST3 ? mongoConnectionHosts.push(`${process.env.MONGO_HOST3}:${process.env.MONGO_PORT3}`) : null;
    process.env.MONGO_HOST4 ? mongoConnectionHosts.push(`${process.env.MONGO_HOST4}:${process.env.MONGO_PORT4}`) : null;

    if (mongoConnectionHosts.length === 0) {
      throw new Error('Подключите базу');
    }

    if (Core.GetBoolean(replica)) {
      urlMongo = `mongodb://${user}:${password}@${mongoConnectionHosts.join(',')}/${base}?authSource=admin`;
    } else {
      urlMongo = `mongodb://${user}:${password}@${mongoConnectionHosts[0]}/${base}?authSource=admin`;
    }
    return {
      uri: urlMongo,
    };
  }
}
