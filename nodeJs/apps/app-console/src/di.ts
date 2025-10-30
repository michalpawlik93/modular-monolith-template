
import { Container } from 'inversify';
import { MONGO_TOKENS, MongoConnection, registerMongoConnection, registerServiceBus} from '@app/core';
import { registerLookupsDomain } from '@app/lookup';

export async function setupContainer(): Promise<{
  container: Container;
}> {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);
  registerServiceBus(container);
  registerLookupsDomain(container);
  registerMongoConnection(
    container,
    'mongodb://localhost:27017/app'
  );
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