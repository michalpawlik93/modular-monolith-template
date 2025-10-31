import { Container } from 'inversify';
import { ICommandBus, InMemoryServiceBus, TYPES } from './serviceBus';
import { ServiceBusLoggingMiddleware } from './serviceBusLoggingMiddleware';

export const COMMAND_BUS_TOKENS = {
  CommandBus: Symbol.for('ICommandBus'),
};

export const registerServiceBus = (container: Container) => {
  if (!container.isBound(TYPES.Container)) {
    container.bind<Container>(TYPES.Container).toConstantValue(container);
  }

  if (!container.isBound(COMMAND_BUS_TOKENS.CommandBus)) {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.CommandBus)
      .to(InMemoryServiceBus)
      .inSingletonScope();
  }
  container
    .bind(TYPES.Middleware)
    .to(ServiceBusLoggingMiddleware)
    .inSingletonScope();
};
