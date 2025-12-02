import {
  Result,
  BasicError,
  IAccountProductsFacade,
  CreateAccountWithProductsResponseContract,
  CreateAccountWithProductsCommandContract,
  IN_MEMORY_TRANSPORT,
} from '@app/core';

export const invokeCreateAccountWithProducts = async (
  facade: IAccountProductsFacade,
  payload: CreateAccountWithProductsCommandContract,
): Promise<Result<CreateAccountWithProductsResponseContract, BasicError>> => {
  return facade.invokeCreateAccountWithProducts(payload, { via: IN_MEMORY_TRANSPORT });
};
