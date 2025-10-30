import { Container } from 'inversify';
import { IServiceBus, ServiceBus } from './serviceBus';

export const SERVICE_BUS_TOKENS = {
  ServiceBus: Symbol.for('IServiceBus'),
  Middleware: Symbol.for('Middleware'),
};

export const registerServiceBus = (container: Container) => {
  container.bind<IServiceBus>(SERVICE_BUS_TOKENS.ServiceBus).to(ServiceBus);
};