import {
  Result,
  BasicError,
  Pager,
  PagerResult,
  IProductBaseFacade,
  ProductContract,
} from '@app/core';

export const invokeGetPagedProducts = async (
  facade: IProductBaseFacade,
  pager: Pager,
): Promise<Result<PagerResult<ProductContract>, BasicError>> => {
  return facade.getPagedProducts(pager, { via: 'inMemory' });
};
