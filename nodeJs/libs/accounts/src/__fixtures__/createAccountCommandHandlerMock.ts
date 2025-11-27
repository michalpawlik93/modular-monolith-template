import { Container } from 'inversify';
import {
  ok,
  Result,
  BasicError,
  Envelope,
  registerCommandHandlerMock,
} from '@app/core';
import {
  CREATE_ACCOUNT_COMMAND_TYPE,
  CreateAccountCommand,
  CreateAccountResponse,
} from '../application/base/handlers/createAccountCommandHandler';

export const mockCreateAccountCommandHandler = (
  container: Container,
  result?: Promise<Result<CreateAccountResponse, BasicError>>,
): Container =>
  registerCommandHandlerMock<CreateAccountCommand, CreateAccountResponse>(
    container,
    CREATE_ACCOUNT_COMMAND_TYPE,
    {
      defaultResult: (env: Envelope<CreateAccountCommand>) =>
        ok({ id: env.payload.id ?? 'mock-account' }),
      result,
    },
  );
