import { Container } from 'inversify';
import {
  registerLogging,
  registerMongoConnection,
  registerServiceBus,
  registerGrpcCommandBusServer,
  GRPC_SERVER_CONFIG_TOKEN,
  MONGO_TOKENS,
  MongoConnection,
  type GrpcServerConfig,
  type GrpcRoutingConfig,
} from '@app/core';
import { registerLookupsDomain } from '@app/lookup';
import {
  buildLoggerConfig,
  buildMongoConfig,
  buildGrpcServerConfig,
  buildGrpcRoutingConfig,
} from './config';

export const container = new Container();

container.bind<Container>(Container).toConstantValue(container);

registerLogging(container, buildLoggerConfig());
const grpcRoutingConfig = buildGrpcRoutingConfig();
container.bind<GrpcRoutingConfig>('GrpcRoutingConfig').toConstantValue(grpcRoutingConfig);
registerServiceBus(container);
const grpcServerConfig = buildGrpcServerConfig();
container
  .bind<GrpcServerConfig>(GRPC_SERVER_CONFIG_TOKEN)
  .toConstantValue(grpcServerConfig);
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
