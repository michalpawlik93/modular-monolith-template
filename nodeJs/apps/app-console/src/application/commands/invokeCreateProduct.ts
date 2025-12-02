import {
  Result,
  BasicError,
  IProductBaseFacade,
  CreateProductCommandContract,
  CreateProductResponseContract,
  IN_MEMORY_TRANSPORT,
} from '@app/core';

export const invokeCreateProduct = async (
  facade: IProductBaseFacade,
  payload: CreateProductCommandContract,
): Promise<Result<CreateProductResponseContract, BasicError>> => {
  return facade.invokeCreateProduct(payload, { via: IN_MEMORY_TRANSPORT });
};
