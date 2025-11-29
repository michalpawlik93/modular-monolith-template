import {
  Result,
  BasicError,
  IProductBaseFacade,
  CreateProductCommandContract,
  CreateProductResponseContract,
} from '@app/core';

export const invokeCreateProduct = async (
  facade: IProductBaseFacade,
  payload: CreateProductCommandContract,
): Promise<Result<CreateProductResponseContract, BasicError>> => {
  return facade.invokeCreateProduct(payload, { via: 'inMemory' });
};
