import {
  Result,
  BasicError,
  IAccountBaseFacade,
  CreateAccountWithProductsResponseContract,
  CreateAccountWithProductsCommandContract,
} from '@app/core';

export const invokeCreateAccountWithProducts = async (
  facade: IAccountBaseFacade,
  payload: CreateAccountWithProductsCommandContract,
): Promise<Result<CreateAccountWithProductsResponseContract, BasicError>> => {
  return facade.invokeCreateAccountWithProducts(payload, { via: 'inMemory' });
};
