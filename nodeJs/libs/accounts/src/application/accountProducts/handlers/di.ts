import { Container } from 'inversify';
import { Handler, TYPES } from '@app/core';
import {
  CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE,
  CreateAccountWithProductsCommand,
  CreateAccountWithProductsCommandHandler,
} from './createAccountWithProductsCommandHandler';

export const registerAccountProductsCommandHandlers = (container: Container) => {
  container
    .bind<Handler<CreateAccountWithProductsCommand>>(TYPES.Handler)
    .to(CreateAccountWithProductsCommandHandler)
    .inRequestScope()
    .whenNamed(CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE);
};
