import { Container } from 'inversify';
import { Handler, TYPES } from '@app/core';
import {
  GET_PAGED_ACCOUNTS_COMMAND,
  GetPagedAccountsCommand,
  GetPagedAccountsCommandHandler,
} from './getPagedAccountsCommandHandler';
import {
  CREATE_ACCOUNT_COMMAND_TYPE,
  CreateAccountCommand,
  CreateAccountCommandHandler,
} from './createAccountCommandHandler';

export const registerAccountsCommandHandlers = (container: Container) => {
  container
    .bind<Handler<GetPagedAccountsCommand>>(TYPES.Handler)
    .to(GetPagedAccountsCommandHandler)
    .inSingletonScope()
    .whenNamed(GET_PAGED_ACCOUNTS_COMMAND);

  container
    .bind<Handler<CreateAccountCommand>>(TYPES.Handler)
    .to(CreateAccountCommandHandler)
    .inSingletonScope()
    .whenNamed(CREATE_ACCOUNT_COMMAND_TYPE);
};
