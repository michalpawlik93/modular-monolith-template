import { Container } from 'inversify';
import { Db } from 'mongodb';
import { MongoConnection } from './mongoConnection';
import { MONGO_TOKENS, type MongoConfig } from './types';

const bindOrRebind = (container: Container, identifier: symbol, binder: () => void) => {
  if (container.isBound(identifier)) {
    container.unbind(identifier);
  }
  binder();
};

export const registerMongoConnection = (
  container: Container,
  config: MongoConfig,
): MongoConnection => {
  bindOrRebind(container, MONGO_TOKENS.MONGOCONFIG_KEY, () => {
    container.bind<MongoConfig>(MONGO_TOKENS.MONGOCONFIG_KEY).toConstantValue(config);
  });

  bindOrRebind(container, MONGO_TOKENS.MONGOCONNECTION_KEY, () => {
    container.bind<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY).to(MongoConnection).inSingletonScope();
  });

  bindOrRebind(container, MONGO_TOKENS.MONGODB_KEY, () => {
    container
      .bind<Db>(MONGO_TOKENS.MONGODB_KEY)
      .toDynamicValue(() => {
        const mc = container.get(MONGO_TOKENS.MONGOCONNECTION_KEY) as MongoConnection;
        return mc.client.db();
      })
      .inSingletonScope();
  });

  return container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
};
