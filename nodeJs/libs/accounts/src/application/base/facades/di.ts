import { Container } from 'inversify';
import { bindOrRebind, makeBusResolver } from '@app/core';
import {
  ACCOUNT_FACADE_TOKENS,
  IAccountBaseFacade,
  AccountBaseFacade,
} from './accountBaseFacade';

export const registerAccountFacades = (container: Container): void => {
  bindOrRebind(container, ACCOUNT_FACADE_TOKENS.Base, () => {
    container
      .bind<IAccountBaseFacade>(ACCOUNT_FACADE_TOKENS.Base)
      .toDynamicValue(() => {
        const resolver = makeBusResolver(container);
        return new AccountBaseFacade(resolver);
      })
      .inSingletonScope();
  });
};
