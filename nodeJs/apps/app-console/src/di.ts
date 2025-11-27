import { Container } from 'inversify';
import { ulid } from 'ulid';
import {
  registerLogging,
  registerServiceBus,
  RequestContext,
  LOGGING_TYPES,
  type GrpcRoutingConfig,
} from '@app/core';
import { buildAccountsPrismaConfig, registerAccountsDomain } from '@app/accounts';
import { buildProductsPrismaConfig, registerProductsDomain } from '@app/products';
import {
  buildLoggerConfig,
  buildGrpcRoutingConfig,
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
  registerAccountsDomain(container, { prisma: buildAccountsPrismaConfig() });//ToDO refactor
  registerProductsDomain(container, { prisma: buildProductsPrismaConfig() });

  const requestContext = container.get<RequestContext>(LOGGING_TYPES.RequestContext);

  const runWithContext = <T>(fn: () => T | Promise<T>): T | Promise<T> => {
    return requestContext.run({ requestId: ulid()}, fn);
  };

  return { container, runWithContext };
}

export const setupConnections = async (container: Container) => {
  return container;
};

export async function cleanConnections(container: Container) {
  try {
    return container;
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
}
