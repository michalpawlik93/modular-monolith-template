import { Container } from 'inversify';
import {
  type LoggerConfig,
  type GrpcRoutingConfig,
  type MongoConfig,
  registerLogging,
  registerServiceBus,
  registerMongoConnection,
  MongoConnection,
  MONGO_TOKENS,
  isErr,
  RequestContext,
  bindOrRebind,
  bindRequestContext,
} from '@app/core';
import { PrismaModuleConfig } from '@app/core/prisma';
import { registerProductsPrisma, registerProductsRepository } from './infrastructure/prisma';
import { registerProductFacades, registerProductsCommandHandlers } from './application/base';
import { registerProductLogging } from './infrastructure/logging';

export interface ProductsDomainConfig {
  prisma?: PrismaModuleConfig;
}

export interface ProductsModuleConfig extends ProductsDomainConfig {
  logger: LoggerConfig;
  grpc: GrpcRoutingConfig;
  mongo: MongoConfig;
  coreContainer?: Container;
  requestContext?: RequestContext;
}


export const createProductsModuleContainer = (
  config: ProductsModuleConfig,
): Container => {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);

  bindRequestContext(container, config.requestContext);
  registerLogging(container, config.logger);

  bindOrRebind(container, 'GrpcRoutingConfig', () => {
    container
      .bind<GrpcRoutingConfig>('GrpcRoutingConfig')
      .toConstantValue(config.grpc);
  });
  registerServiceBus(container);
  registerMongoConnection(container, config.mongo);

  registerProductsDomain(container, { prisma: config.prisma });
  return container;
};

export const registerProductsDomain = (
  container: Container,
  config: ProductsDomainConfig,
): void => {
  registerProductLogging(container);
  registerProductsPrisma(container, config.prisma);
  registerProductsRepository(container);
  registerProductsCommandHandlers(container);
  registerProductFacades(container);
};

export const connectProductsInfrastructure = async (
  container: Container,
): Promise<void> => {
  if (!container.isBound(MONGO_TOKENS.MONGOCONNECTION_KEY)) {
    return;
  }

  const mongo = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
  const result = await mongo.connect(() => {});
  if (isErr(result)) {
    console.error(result.error.message);
  }
};

export const disconnectProductsInfrastructure = async (
  container: Container,
): Promise<void> => {
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
