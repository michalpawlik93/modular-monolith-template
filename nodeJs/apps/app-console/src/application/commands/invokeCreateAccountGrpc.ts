import { Result, BasicError } from '@app/core';
import {
  IAccountBaseFacade,
  CreateAccountCommandContract,
  CreateAccountResponseContract,
} from '@app/core';

export const invokeCreateAccountGrpc = async (
  facade: IAccountBaseFacade,
  payload: CreateAccountCommandContract,
): Promise<Result<CreateAccountResponseContract, BasicError>> => {
  return facade.invokeCreateAccount(payload, { via: 'grpc' });
};
