import { Container } from 'inversify';
import {
  registerLogging,
  registerServiceBus,
  registerGrpcCommandBusServer,
  GRPC_SERVER_CONFIG_TOKEN,
  type GrpcServerConfig,
  type GrpcRoutingConfig,
  registerMongoConnection,
  MongoConnection,
  MONGO_TOKENS,
  MongoSagaRepository,
  isErr,
} from '@app/core';
import {
  buildAccountsPrismaConfig,
  registerAccountsDomain,
  AccountProductSagaData,
  ACCOUNT_SAGA_REPOSITORY,
} from '@app/accounts';
import { buildProductsPrismaConfig, registerProductsDomain } from '@app/products';
import {
  buildLoggerConfig,
  buildGrpcServerConfig,
  buildGrpcRoutingConfig,
  buildMongoConfig,
} from './config';

export const container = new Container();

container.bind<Container>(Container).toConstantValue(container);

registerLogging(container, buildLoggerConfig());
const grpcRoutingConfig = buildGrpcRoutingConfig();
container.bind<GrpcRoutingConfig>('GrpcRoutingConfig').toConstantValue(grpcRoutingConfig);
registerServiceBus(container);
registerMongoConnection(container, buildMongoConfig());
const grpcServerConfig = buildGrpcServerConfig();
container
  .bind<GrpcServerConfig>(GRPC_SERVER_CONFIG_TOKEN)
  .toConstantValue(grpcServerConfig);
registerGrpcCommandBusServer(container);
registerAccountsDomain(container, { prisma: buildAccountsPrismaConfig() });//ToDO refactor
registerProductsDomain(container, { prisma: buildProductsPrismaConfig() });

export const connectInfrastructure = async (): Promise<void> => {
  const mongo = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
  const result = await mongo.connect(() => {});
  if (isErr(result)) {
    console.error(result.error.message);
    return;
  }

  if (container.isBound(ACCOUNT_SAGA_REPOSITORY)) {
    const sagaRepo =
      container.get<MongoSagaRepository<AccountProductSagaData>>(
        ACCOUNT_SAGA_REPOSITORY,
      );
    const indexResult = await sagaRepo.ensureIndexes();
    if (isErr(indexResult)) {
      console.error(indexResult.error.message);
    }
  }
};

export const disconnectInfrastructure = async (): Promise<void> => {
  try {
    if (container.isBound(MONGO_TOKENS.MONGOCONNECTION_KEY)) {
      const mongo = container.get<MongoConnection>(
        MONGO_TOKENS.MONGOCONNECTION_KEY,
      );
      await mongo.close(() => {});
    }
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
};
