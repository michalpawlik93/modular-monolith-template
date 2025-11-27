import { Container } from 'inversify';
import { bindOrRebind, makeBusResolver } from '@app/core';
import {
  PRODUCT_FACADE_TOKENS,
  IProductBaseFacade,
  ProductBaseFacade,
} from './productBaseFacade';

export const registerProductFacades = (container: Container): void => {
  bindOrRebind(container, PRODUCT_FACADE_TOKENS.Base, () => {
    container
      .bind<IProductBaseFacade>(PRODUCT_FACADE_TOKENS.Base)
      .toDynamicValue(() => {
        const resolver = makeBusResolver(container);
        return new ProductBaseFacade(resolver);
      })
      .inSingletonScope();
  });
};
