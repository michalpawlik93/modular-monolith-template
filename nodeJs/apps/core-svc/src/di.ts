import { Container } from 'inversify';
import {
  registerLogging,
  registerMongoConnection,
  registerServiceBus,
  registerGrpcCommandBusServer,
  MONGO_TOKENS,
  MongoConnection,
} from '@app/core';
import { registerLookupsDomain } from '@app/lookup';
import { buildLoggerConfig, buildMongoConfig } from './config';

export const container = new Container();

container.bind<Container>(Container).toConstantValue(container);

registerLogging(container, buildLoggerConfig());
registerServiceBus(container);
registerGrpcCommandBusServer(container);
const mongoConnection = registerMongoConnection(container, buildMongoConfig());
registerLookupsDomain(container);

export const connectInfrastructure = async (): Promise<void> => {
  await mongoConnection.connect(() => {
    process.exit(1);
  });
};

export const disconnectInfrastructure = async (): Promise<void> => {
  try {
    const connection = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
    await connection.close(() => undefined);
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};
