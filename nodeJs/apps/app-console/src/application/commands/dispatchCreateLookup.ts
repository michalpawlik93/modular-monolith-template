import { ICommandBus, Envelope, Result, BasicError } from '@app/core';
import {
  CreateLookupCommand,
  CREATE_LOOKUP_COMMAND_TYPE,
} from '@app/lookup';

export const dispatchCreateLookup = async (
  bus: ICommandBus,
  payload: CreateLookupCommand
): Promise<Result<null, BasicError>> => {
  const envelope: Envelope<CreateLookupCommand> = {
    type: CREATE_LOOKUP_COMMAND_TYPE,
    payload,
  };

  return bus.dispatch(envelope);
};
