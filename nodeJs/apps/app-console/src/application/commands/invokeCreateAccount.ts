import { Result, BasicError } from '@app/core';
import {
  CreateAccountCommand,
  CreateAccountResponse,
  IAccountBaseFacade,
} from '@app/accounts';

export const invokeCreateAccount = async (
  facade: IAccountBaseFacade,
  payload: CreateAccountCommand,
): Promise<Result<CreateAccountResponse, BasicError>> => {
  return facade.invokeCreateAccount(payload, { via: 'inMemory' });
};
