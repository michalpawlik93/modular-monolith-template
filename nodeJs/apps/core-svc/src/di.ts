import { Container } from 'inversify';
import {
  RequestContext,
  PRODUCT_FACADE_TOKEN,
  registerLogging,
  registerGrpcCommandBusServer,
  GRPC_SERVER_CONFIG_TOKEN,
  type GrpcServerConfig,
  createCoreModuleContainer,
  connectCoreInfrastructure,
  disconnectCoreInfrastructure,
  bindRequestContext,
  SetupResult,
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
  buildProductsLoggerConfig,
  buildGrpcServerConfig,
  buildGrpcRoutingConfig,
  buildAccountsMongoConfig,
  buildProductsMongoConfig,
  buildGrpcServerLoggerConfig,
  buildCoreLoggerConfig,
  buildCoreMongoConfig,
} from './config';


export async function setupContainer(): Promise<SetupResult> {  
   const grpcServerContainer = new Container();
  const requestContext = new RequestContext();
 const grpcRoutingConfig = buildGrpcRoutingConfig();

  
const coreContainer = createCoreModuleContainer({
  logger: buildCoreLoggerConfig(),
  mongo: buildCoreMongoConfig(),
  requestContext,
});

const productsContainer = createProductsModuleContainer({
  logger: buildProductsLoggerConfig(),
  grpc: grpcRoutingConfig,
  mongo: buildProductsMongoConfig(),
  prisma: buildProductsPrismaConfig(),
  coreContainer,
  requestContext,
});

const accountsContainer = createAccountsModuleContainer({
  logger: buildAccountsLoggerConfig(),
  grpc: grpcRoutingConfig,
  mongo: buildAccountsMongoConfig(),
  prisma: buildAccountsPrismaConfig(),
  coreContainer,
  requestContext,
  productFacade: productsContainer.get(PRODUCT_FACADE_TOKEN),
});


grpcServerContainer.bind<Container>(Container).toConstantValue(grpcServerContainer);
bindRequestContext(grpcServerContainer, requestContext);
registerLogging(grpcServerContainer, buildGrpcServerLoggerConfig());

const grpcServerConfig = buildGrpcServerConfig();
grpcServerContainer
  .bind<GrpcServerConfig>(GRPC_SERVER_CONFIG_TOKEN)
  .toConstantValue(grpcServerConfig);
registerGrpcCommandBusServer(grpcServerContainer, [
  accountsContainer,
  productsContainer,
]);
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
  return { modules, requestContext, appContainer: grpcServerContainer };
}