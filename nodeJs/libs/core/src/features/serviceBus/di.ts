import { Container } from 'inversify';
import { ICommandBus, TYPES } from './serviceBus';
import { InMemoryServiceBus } from './inMemoryServiceBus';
import {
  GrpcServiceBus,
  GRPC_SERVICE_BUS_TOKENS,
} from './grpcServiceBus';
import type { GrpcRoutingConfig } from '../../providers/grpc/grpcConfig';
import { ServiceBusLoggingMiddleware } from './serviceBusLoggingMiddleware';
import { bindOrRebind } from '../../utils/inversify';
import { loadBusProto } from '../../providers/grpc/protoLoader';
import { GrpcClientFactory } from '../../providers/grpc/grpcClientFactory';

export const COMMAND_BUS_TOKENS = {
  CommandBus: Symbol.for('ICommandBus'),
  InMemory: Symbol('InMemoryCommandBus'),
  Grpc: Symbol('GrpcCommandBus'),
} as const;

export const registerServiceBus = (
  container: Container,
) => {
  if (!container.isBound(GRPC_SERVICE_BUS_TOKENS.ClientFactory)) {
    const pkg = loadBusProto();
    const routingConfig = container.get<GrpcRoutingConfig>('GrpcRoutingConfig');
    const clientFactory = new GrpcClientFactory(
      pkg,
      routingConfig.client,
    );
    container
      .bind<GrpcClientFactory>(GRPC_SERVICE_BUS_TOKENS.ClientFactory)
      .toConstantValue(clientFactory);
  }

  bindOrRebind(container, COMMAND_BUS_TOKENS.InMemory, () => {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.InMemory)
      .to(InMemoryServiceBus)
      .inSingletonScope();
  });

  bindOrRebind(container, COMMAND_BUS_TOKENS.Grpc, () => {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.Grpc)
      .to(GrpcServiceBus)
      .inSingletonScope();
  });

  const primaryToken = COMMAND_BUS_TOKENS.InMemory;

  bindOrRebind(container, COMMAND_BUS_TOKENS.CommandBus, () => {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.CommandBus)
      .toService(primaryToken);
  });

  if (!container.isBound(TYPES.Middleware)) {
    container
      .bind(TYPES.Middleware)
      .to(ServiceBusLoggingMiddleware)
      .inSingletonScope();
  }
};
