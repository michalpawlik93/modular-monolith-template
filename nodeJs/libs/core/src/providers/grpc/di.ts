import { Container } from 'inversify';
import { GrpcCommandBusServer } from './grpcCommandBusServer';

export const registerGrpcCommandBusServer = (container: Container): void => {
  container.bind(GrpcCommandBusServer).toSelf().inSingletonScope();
};
