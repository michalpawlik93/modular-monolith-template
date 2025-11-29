import { Container } from 'inversify';
import { ulid } from 'ulid';
import {
  registerLogging,
  registerServiceBus,
  RequestContext,
  LOGGING_TYPES,
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
  buildGrpcRoutingConfig,
  buildMongoConfig,
} from './config';

export async function setupContainer(): Promise<{
  container: Container;
  runWithContext: <T>(fn: () => T | Promise<T>) => T | Promise<T>;
}> {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);
  registerLogging(container, buildLoggerConfig());
  const grpcConfig = buildGrpcRoutingConfig();
  container.bind<GrpcRoutingConfig>('GrpcRoutingConfig').toConstantValue(grpcConfig);
  registerServiceBus(container);
  registerMongoConnection(container, buildMongoConfig());
  registerAccountsDomain(container, { prisma: buildAccountsPrismaConfig() });//ToDO refactor
  registerProductsDomain(container, { prisma: buildProductsPrismaConfig() });

  const requestContext = container.get<RequestContext>(LOGGING_TYPES.RequestContext);

  const runWithContext = <T>(fn: () => T | Promise<T>): T | Promise<T> => {
    return requestContext.run({ requestId: ulid()}, fn);
  };

  return { container, runWithContext };
}

export const setupConnections = async (container: Container) => {
  const mongo = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
  const mongoResult = await mongo.connect(() => {});
  if (isErr(mongoResult)) {
    return container;
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

  return container;
};

export async function cleanConnections(container: Container) {
  try {
    if (!container) {
      return container;
    }
    if (container.isBound(MONGO_TOKENS.MONGOCONNECTION_KEY)) {
      const mongo = container.get<MongoConnection>(
        MONGO_TOKENS.MONGOCONNECTION_KEY,
      );
      await mongo.close(() => {});
    }
    return container;
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
}
