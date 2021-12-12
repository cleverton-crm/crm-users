import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';

export class MongoConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    let urlMongo;
    const replica = process.env.MONGO_REPLICA;
    const auth = process.env.MONGO_ENABLE;
    const user = process.env.MONGO_ROOT_USER;
    const password = process.env.MONGO_ROOT_PASSWORD;
    const host1 = process.env.MONGO_HOST1;
    const host2 = process.env.MONGO_HOST2;
    const host3 = process.env.MONGO_HOST3;
    const base = process.env.MONGO_DATABASE;
    const port1 = process.env.MONGO_PORT1;
    const port2 = process.env.MONGO_PORT2;
    const port3 = process.env.MONGO_PORT3;

    if (replica) {
      urlMongo = `mongodb://${user}:${password}@${host1}:${port1},${host2}:${port2},${host3}:${port3}/${base}?authSource=admin`;
    } else {
      urlMongo = `mongodb://${user}:${password}@${host1}:${port1}/${base}?authSource=admin`;
    }

    return {
      uri: urlMongo,
    };
  }
}
