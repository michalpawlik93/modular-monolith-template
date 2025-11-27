import { Result, BasicError } from '@app/core';
import {
  CreateProductCommand,
  CreateProductResponse,
  IProductBaseFacade,
} from '@app/products';

export const invokeCreateProduct = async (
  facade: IProductBaseFacade,
  payload: CreateProductCommand,
): Promise<Result<CreateProductResponse, BasicError>> => {
  return facade.invokeCreateProduct(payload, { via: 'inMemory' });
};
