
import { Container } from 'inversify';
import {
  MONGO_TOKENS,
  MongoConnection,
  registerMongoConnection,
  registerServiceBus,
  TYPES,
} from '@app/core';
import { registerLookupsDomain } from '@app/lookup';
import { ConsoleLoggingMiddleware } from './application/loggingMiddleware';

export async function setupContainer(): Promise<{
  container: Container;
}> {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);
  registerServiceBus(container);
  container
    .bind(TYPES.Middleware)
    .to(ConsoleLoggingMiddleware)
    .inSingletonScope();
  registerMongoConnection(
    container,
    'mongodb://localhost:27017/app'
  );
  registerLookupsDomain(container);
  return { container };
}


export const setupConnections = async (container: Container) => {
  const mongoConnection = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
  await mongoConnection.connect(() => {
    process.exit(1);
});
}

export async function cleanConnections(container: Container) {
  try {
    if (container) {
      const mongoConnection = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
      await mongoConnection.close(() => {});
    }
  } catch (error) {
    console.error('❌ Error disconnecting:', error);
  }
}
