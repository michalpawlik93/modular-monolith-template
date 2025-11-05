import { Container } from 'inversify';
import { GrpcCommandBusServer } from './grpc-command-bus-server';
import { TYPES } from '../../features/serviceBus/serviceBus';

const bindOrRebind = (
  container: Container,
  identifier: string | symbol | (new (...args: unknown[]) => object),
  binder: () => void,
) => {
  if (container.isBound(identifier)) {
    container.unbind(identifier);
  }
  binder();
};

export const registerGrpcCommandBusServer = (container: Container): void => {
  if (!container.isBound(TYPES.Container)) {
    container.bind<Container>(TYPES.Container).toConstantValue(container);
  }

  bindOrRebind(container, GrpcCommandBusServer, () => {
    container.bind(GrpcCommandBusServer).toSelf().inSingletonScope();
  });
};
