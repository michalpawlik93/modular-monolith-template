import { Container } from 'inversify';
import {
  ok,
  Result,
  BasicError,
  Envelope,
  registerCommandHandlerMock,
} from '@app/core';
import {
  DELETE_ACCOUNT_COMMAND_TYPE,
  DeleteAccountCommand,
  DeleteAccountResponse,
} from '../application/base/handlers/deleteAccountCommandHandler';

export const mockDeleteAccountCommandHandler = (
  container: Container,
  result?: Promise<Result<DeleteAccountResponse, BasicError>>,
): Container =>
  registerCommandHandlerMock<DeleteAccountCommand, DeleteAccountResponse>(
    container,
    DELETE_ACCOUNT_COMMAND_TYPE,
    {
      defaultResult: (env: Envelope<DeleteAccountCommand>) =>
        ok({ id: env.payload.id }),
      result,
    },
  );
