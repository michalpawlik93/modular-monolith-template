import { Container } from 'inversify';
import { bindOrRebind, makeBusResolver } from '@app/core';
import {
  AccountBaseFacade,
} from './accountBaseFacade';
import {
  ACCOUNT_FACADE_TOKEN,
  IAccountBaseFacade,
} from '@app/core';

export const registerAccountFacades = (container: Container): void => {
  bindOrRebind(container, ACCOUNT_FACADE_TOKEN, () => {
    container
      .bind<IAccountBaseFacade>(ACCOUNT_FACADE_TOKEN)
      .toDynamicValue(() => {
        const resolver = makeBusResolver(container);
        return new AccountBaseFacade(resolver);
      })
      .inSingletonScope();
  });
};
