import { Container } from 'inversify';
import { GrpcCommandBusServer } from './grpcCommandBusServer';

export const GRPC_HANDLER_CONTAINER_TOKEN = Symbol.for('GrpcHandlerContainer');

export const registerGrpcCommandBusServer = (
  container: Container,
  handlerContainers?: Container[],
): void => {
  if (!container.isBound(GrpcCommandBusServer)) {
    container.bind(GrpcCommandBusServer).toSelf().inSingletonScope();
  }

  if (handlerContainers?.length) {
    if (container.isBound(GRPC_HANDLER_CONTAINER_TOKEN)) {
      container.unbind(GRPC_HANDLER_CONTAINER_TOKEN);
    }

    handlerContainers.forEach((handlerContainer) => {
      container
        .bind<Container>(GRPC_HANDLER_CONTAINER_TOKEN)
        .toConstantValue(handlerContainer);
    });
  }
};
