import 'reflect-metadata';
import { injectable } from 'inversify';
import {
  BusResolver,
  Transport,
  Envelope,
  Result,
  BasicError,
  isErr,
} from '@app/core';
import {
  CREATE_LOOKUP_COMMAND_TYPE,
  CreateLookupCommand,
  CreateLookupResponse,
} from '../handlers/createLookupCommandHandler';

export const FACADE_TOKENS = {
  LookupBase: Symbol.for('LookupBaseFacade'),
} as const;

export interface ILookupBaseFacade {
  invokeCreateLookup(
    payload: CreateLookupCommand,
    opts?: { via?: Transport },
  ): Promise<Result<CreateLookupResponse, BasicError>>;
}

@injectable()
export class LookupBaseFacade implements ILookupBaseFacade {
  constructor(
    private readonly resolveBus: BusResolver,
  ) {}

  async invokeCreateLookup(
    payload: CreateLookupCommand,
    opts?: { via?: Transport },
  ): Promise<Result<CreateLookupResponse, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<CreateLookupCommand> = {
      type: CREATE_LOOKUP_COMMAND_TYPE,
      payload,
    };

    return busResult.value.invoke<CreateLookupCommand, CreateLookupResponse>(
      envelope,
    );
  }
}
