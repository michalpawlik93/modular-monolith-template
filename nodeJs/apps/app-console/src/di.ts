import {
  RequestContext,
  PRODUCT_FACADE_TOKEN,
  connectCoreInfrastructure,
  disconnectCoreInfrastructure,
  createCoreModuleContainer,
  ModuleContainer,
} from '@app/core';
import {
  buildAccountsPrismaConfig,
  createAccountsModuleContainer,
  connectAccountsInfrastructure,
  disconnectAccountsInfrastructure,
} from '@app/accounts';
import {
  buildProductsPrismaConfig,
  createProductsModuleContainer,
  connectProductsInfrastructure,
  disconnectProductsInfrastructure,
} from '@app/products';
import {
  buildAccountsLoggerConfig,
  buildAccountsMongoConfig,
  buildGrpcRoutingConfig,
  buildProductsLoggerConfig,
  buildProductsMongoConfig,
  buildCoreLoggerConfig,
  buildCoreMongoConfig,
} from './config';

export interface SetupResult {
  modules: {
    core: ModuleContainer;
    accounts: ModuleContainer;
    products: ModuleContainer;
  };
  requestContext: RequestContext;
}

export async function setupContainer(): Promise<SetupResult> {
  const requestContext = new RequestContext();
  const grpcConfig = buildGrpcRoutingConfig();

  const coreContainer = createCoreModuleContainer({
    logger: buildCoreLoggerConfig(),
    mongo: buildCoreMongoConfig(),
    requestContext,
  });

  const productsContainer = createProductsModuleContainer({
    logger: buildProductsLoggerConfig(),
    grpc: grpcConfig,
    mongo: buildProductsMongoConfig(),
    prisma: buildProductsPrismaConfig(),
    coreContainer,
    requestContext,
  });

  const accountsContainer = createAccountsModuleContainer({
    logger: buildAccountsLoggerConfig(),
    grpc: grpcConfig,
    mongo: buildAccountsMongoConfig(),
    prisma: buildAccountsPrismaConfig(),
    coreContainer,
    requestContext,
    productFacade: productsContainer.get(PRODUCT_FACADE_TOKEN),
  });

  const modules: SetupResult['modules'] = {
    core: {
      name: 'core',
      container: coreContainer,
      connect: () => connectCoreInfrastructure(coreContainer),
      disconnect: () => disconnectCoreInfrastructure(coreContainer),
    },
    accounts: {
      name: 'accounts',
      container: accountsContainer,
      connect: () => connectAccountsInfrastructure(accountsContainer),
      disconnect: () => disconnectAccountsInfrastructure(accountsContainer),
    },
    products: {
      name: 'products',
      container: productsContainer,
      connect: () => connectProductsInfrastructure(productsContainer),
      disconnect: () => disconnectProductsInfrastructure(productsContainer),
    },
  };
  return { modules, requestContext };
}