import { ICommandBus, Envelope, Result, BasicError } from '@app/core';
import {
  CreateLookupCommand,
  CreateLookupResponse,
  CREATE_LOOKUP_COMMAND_TYPE,
} from '@app/lookup';

export const invokeCreateLookup = async (
  bus: ICommandBus,
  payload: CreateLookupCommand
): Promise<Result<CreateLookupResponse, BasicError>> => {
  const envelope: Envelope<CreateLookupCommand> = {
    type: CREATE_LOOKUP_COMMAND_TYPE,
    payload,
  };

  return bus.invoke<CreateLookupCommand, CreateLookupResponse>(envelope);
};
