import { Container } from 'inversify';
import {
  COMMAND_BUS_TOKENS,
  ICommandBus,
  Envelope,
  Result,
  BasicError,
  basicErr,
} from '@app/core';
import {
  CreateLookupCommand,
  CreateLookupResponse,
  CREATE_LOOKUP_COMMAND_TYPE,
} from '@app/lookup';

export const invokeCreateLookupGrpc = async (
  container: Container,
  payload: CreateLookupCommand,
): Promise<Result<CreateLookupResponse, BasicError>> => {
  if (!container.isBound(COMMAND_BUS_TOKENS.Grpc)) {
    return basicErr('GrpcCommandBus is not registered in the container');
  }

  const bus = container.get<ICommandBus>(COMMAND_BUS_TOKENS.Grpc);
  const envelope: Envelope<CreateLookupCommand> = {
    type: CREATE_LOOKUP_COMMAND_TYPE,
    payload,
  };

  return bus.invoke<CreateLookupCommand, CreateLookupResponse>(envelope);
};
