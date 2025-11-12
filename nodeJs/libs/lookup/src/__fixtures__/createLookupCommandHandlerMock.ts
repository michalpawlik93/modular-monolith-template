import {
  ok,
  Result,
  BasicError,
  Envelope,
  registerCommandHandlerMock,
} from '@app/core';
import { Container } from 'inversify';
import {
  CREATE_LOOKUP_COMMAND_TYPE,
  CreateLookupCommand,
  CreateLookupResponse,
} from '../application/base/handlers/createLookupCommandHandler';

export const mockCreateLookupCommandHandler = (
  container: Container,
  result?: Promise<Result<CreateLookupResponse, BasicError>>,
): Container =>
  registerCommandHandlerMock<CreateLookupCommand, CreateLookupResponse>(
    container,
    CREATE_LOOKUP_COMMAND_TYPE,
    {
      defaultResult: (env: Envelope<CreateLookupCommand>) =>
        ok({ id: env.payload.id }),
      result,
    },
  );
