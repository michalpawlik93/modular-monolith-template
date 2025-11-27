import { Result, BasicError, Pager, PagerResult } from '@app/core';
import { IProductBaseFacade, Product } from '@app/products';

export const invokeGetPagedProducts = async (
  facade: IProductBaseFacade,
  pager: Pager,
): Promise<Result<PagerResult<Product>, BasicError>> => {
  return facade.getPagedProducts(pager, { via: 'inMemory' });
};
