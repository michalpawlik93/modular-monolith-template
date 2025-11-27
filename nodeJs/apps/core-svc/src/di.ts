import { Container } from 'inversify';
import {
  registerLogging,
  registerServiceBus,
  registerGrpcCommandBusServer,
  GRPC_SERVER_CONFIG_TOKEN,
  type GrpcServerConfig,
  type GrpcRoutingConfig,
} from '@app/core';
import { buildAccountsPrismaConfig, registerAccountsDomain } from '@app/accounts';
import { buildProductsPrismaConfig, registerProductsDomain } from '@app/products';
import {
  buildLoggerConfig,
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
registerAccountsDomain(container, { prisma: buildAccountsPrismaConfig() });//ToDO refactor
registerProductsDomain(container, { prisma: buildProductsPrismaConfig() });

export const connectInfrastructure = async (): Promise<void> => {
  return;
};

export const disconnectInfrastructure = async (): Promise<void> => {
  try {
    return;
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
};
