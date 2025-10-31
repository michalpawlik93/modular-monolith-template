import { Container } from 'inversify';
import { ulid } from 'ulid';
import {
  MONGO_TOKENS,
  MongoConnection,
  registerLogging,
  registerMongoConnection,
  registerServiceBus,
  RequestContext,
  LOGGING_TYPES,
} from '@app/core';
import { registerLookupsDomain } from '@app/lookup';
import { buildLoggerConfig, buildMongoConfig } from './config';

export async function setupContainer(): Promise<{
  container: Container;
  runWithContext: <T>(fn: () => T | Promise<T>) => T | Promise<T>;
}> {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);
  registerLogging(container, buildLoggerConfig());
  registerServiceBus(container);
  registerMongoConnection(container, buildMongoConfig());
  registerLookupsDomain(container);

  const requestContext = container.get<RequestContext>(LOGGING_TYPES.RequestContext);
  const requestId = ulid();

  const runWithContext = <T>(fn: () => T | Promise<T>): T | Promise<T> => {
    return requestContext.run({ requestId }, fn);
  };

  return { container, runWithContext };
}

export const setupConnections = async (container: Container) => {
  const mongoConnection = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
  await mongoConnection.connect(() => {
    process.exit(1);
  });
};

export async function cleanConnections(container: Container) {
  try {
    if (container) {
      const mongoConnection = container.get<MongoConnection>(
        MONGO_TOKENS.MONGOCONNECTION_KEY,
      );
      await mongoConnection.close(() => undefined);
    }
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
}
