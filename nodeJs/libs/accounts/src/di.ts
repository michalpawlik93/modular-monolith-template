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
  IProductBaseFacade,
  PRODUCT_FACADE_TOKEN,
  bindRequestContext,
} from '@app/core';
import { PrismaModuleConfig } from '@app/core/prisma';
import { registerAccountFacades, registerAccountsCommandHandlers } from './application/base';
import { registerAccountProductsCommandHandlers, registerAccountProductsFacades, registerAccountProductSagas } from './application/accountProducts';
import { registerAccountLogging } from './infrastructure/logging';
import { registerAccountsPrisma, registerAccountRepository } from './infrastructure/prisma';

export interface AccountsDomainConfig {
  prisma?: PrismaModuleConfig;
}

export interface AccountsModuleConfig extends AccountsDomainConfig {
  logger: LoggerConfig;
  grpc: GrpcRoutingConfig;
  mongo: MongoConfig;
  coreContainer: Container;
  requestContext?: RequestContext;
  productFacade?: IProductBaseFacade;
}

export const createAccountsModuleContainer = (
  config: AccountsModuleConfig,
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

  if (config.productFacade) {
    bindOrRebind(container, PRODUCT_FACADE_TOKEN, () => {
      container
        .bind<IProductBaseFacade>(PRODUCT_FACADE_TOKEN)
        .toConstantValue(config.productFacade as IProductBaseFacade);
    });
  }

  registerAccountsDomain(container, { prisma: config.prisma }, config.coreContainer);
  return container;
};

export const registerAccountsDomain = (
  container: Container,
  config: AccountsDomainConfig,
  coreContainer: Container,
): void => {
  registerAccountLogging(container);
  registerAccountsPrisma(container, config.prisma);
  registerAccountRepository(container);
  registerAccountProductSagas(container, coreContainer);
  registerAccountProductsCommandHandlers(container);
  registerAccountProductsFacades(container);
  registerAccountsCommandHandlers(container);
  registerAccountFacades(container);
};

export const connectAccountsInfrastructure = async (
  container: Container,
): Promise<void> => {
  if (!container.isBound(MONGO_TOKENS.MONGOCONNECTION_KEY)) {
    return;
  }

  const mongo = container.get<MongoConnection>(MONGO_TOKENS.MONGOCONNECTION_KEY);
  const result = await mongo.connect(() => {});
  if (isErr(result)) {
    console.error(result.error.message);
    return;
  }
};

export const disconnectAccountsInfrastructure = async (
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
