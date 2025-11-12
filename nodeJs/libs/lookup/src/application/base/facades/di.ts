import { Container } from 'inversify';
import { bindOrRebind, makeBusResolver } from '@app/core';
import {
  FACADE_TOKENS,
  ILookupBaseFacade,
  LookupBaseFacade,
} from './lookupBaseFacade';

export const registerLookupFacades = (container: Container): void => {
  bindOrRebind(container, FACADE_TOKENS.LookupBase, () => {
    container
      .bind<ILookupBaseFacade>(FACADE_TOKENS.LookupBase)
      .toDynamicValue(() => {
        const resolver = makeBusResolver(container);
        return new LookupBaseFacade(resolver);
      })
      .inSingletonScope();
  });
};
