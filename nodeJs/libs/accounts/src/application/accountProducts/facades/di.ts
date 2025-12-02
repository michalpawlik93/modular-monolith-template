import { Container } from 'inversify';
import { bindOrRebind, makeBusResolver } from '@app/core';
import {
  AccountProductsFacade,
} from './accountProductFacade';
import {
  ACCOUNT_PRODUCTS_FACADE_TOKEN,
  IAccountProductsFacade,
} from '@app/core';

export const registerAccountProductsFacades = (container: Container): void => {
  bindOrRebind(container, ACCOUNT_PRODUCTS_FACADE_TOKEN, () => {
    container
      .bind<IAccountProductsFacade>(ACCOUNT_PRODUCTS_FACADE_TOKEN)
      .toDynamicValue(() => {
        const resolver = makeBusResolver(container);
        return new AccountProductsFacade(resolver);
      })
      .inSingletonScope();
  });
};
