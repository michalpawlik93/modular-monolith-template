import { Container } from 'inversify';
import { ICommandBus, TYPES } from './serviceBus';
import { InMemoryServiceBus } from './inMemoryServiceBus';
import { GrpcServiceBus } from './GrpcServiceBus';
import { ServiceBusLoggingMiddleware } from './serviceBusLoggingMiddleware';
import { bindOrRebind } from '../../utils/inversify';

export const COMMAND_BUS_TOKENS = {
  CommandBus: Symbol.for('ICommandBus'),
  InMemory: Symbol('InMemoryCommandBus'),
  Grpc: Symbol('GrpcCommandBus'),
} as const;

export const registerServiceBus = (
  container: Container,
) => {
  if (!container.isBound(TYPES.Container)) {
    container.bind<Container>(TYPES.Container).toConstantValue(container);
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
