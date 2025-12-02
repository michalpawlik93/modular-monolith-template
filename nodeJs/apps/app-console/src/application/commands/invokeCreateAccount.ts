import { Result, BasicError, IN_MEMORY_TRANSPORT } from '@app/core';
import {
  IAccountBaseFacade,
  CreateAccountCommandContract,
  CreateAccountResponseContract,
} from '@app/core';

export const invokeCreateAccount = async (
  facade: IAccountBaseFacade,
  payload: CreateAccountCommandContract,
): Promise<Result<CreateAccountResponseContract, BasicError>> => {
  return facade.invokeCreateAccount(payload, { via: IN_MEMORY_TRANSPORT });
};
