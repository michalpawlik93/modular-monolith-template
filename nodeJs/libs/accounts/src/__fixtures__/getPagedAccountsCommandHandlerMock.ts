import { Container } from 'inversify';
import {
  ok,
  Result,
  BasicError,
  PagerResult,
  registerCommandHandlerMock,
} from '@app/core';
import {
  GET_PAGED_ACCOUNTS_COMMAND,
  GetPagedAccountsCommand,
} from '../application/base/handlers/getPagedAccountsCommandHandler';
import { Account, mockAccount } from '../domain/models/account';

export const mockGetPagedAccountsCommandHandler = (
  container: Container,
  result?: Promise<Result<PagerResult<Account>, BasicError>>,
): Container =>
  registerCommandHandlerMock<GetPagedAccountsCommand, PagerResult<Account>>(
    container,
    GET_PAGED_ACCOUNTS_COMMAND,
    {
      defaultResult: () =>
        ok({
          data: [mockAccount()],
          cursor: 'mock-cursor',
        }),
      result,
    },
  );
