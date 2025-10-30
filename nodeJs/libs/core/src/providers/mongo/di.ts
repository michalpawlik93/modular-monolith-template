import { Container } from 'inversify';
import { Db } from 'mongodb';
import { MongoConnection } from './mongoConnection';

export const MONGO_TOKENS = {
  MONGODB_KEY: Symbol.for('MongoDB'),
  MONGOCONNECTION_KEY: Symbol.for('MongoConnection'),
};

export const registerMongoConnection = (
  container: Container,
  dbUri: string
): MongoConnection => {
  const mongoConnection = new MongoConnection(dbUri);
  container
    .bind<Db>(MONGO_TOKENS.MONGODB_KEY)
    .toDynamicValue(() => mongoConnection.client.db())
    .inSingletonScope();

  container
    .bind<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY)
    .toConstantValue(mongoConnection);
  return mongoConnection;
};
