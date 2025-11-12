import { Container } from 'inversify';
import { ICommandBus } from './serviceBus';
import { COMMAND_BUS_TOKENS } from './di';
import { Result, BasicError, ok, basicErr } from '../../utils/result';

export type Transport = 'grpc' | 'inMemory' | 'rabbitMq';

export type BusResolver = (
  transport?: Transport,
) => Result<ICommandBus, BasicError>;

const getBusName = (transport: Transport): string => {
  return transport === 'grpc'
    ? 'GrpcCommandBus'
    : transport === 'inMemory'
    ? 'InMemoryCommandBus'
    : 'RabbitMqCommandBus';
};

export const makeBusResolver = (container: Container): BusResolver => {
  return (transport?: Transport) => {
    if (!transport) {
      return basicErr('Transport is required');
    }

    const token =
      transport === 'grpc'
        ? COMMAND_BUS_TOKENS.Grpc
        : transport === 'inMemory'
        ? COMMAND_BUS_TOKENS.InMemory
        : COMMAND_BUS_TOKENS.RabbitMq;

    if (!container.isBound(token)) {
      const busName = getBusName(transport);
      return basicErr(`${busName} is not registered in the container`);
    }

    return ok(container.get<ICommandBus>(token));
  };
};
