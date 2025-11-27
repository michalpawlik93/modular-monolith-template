import { Result, BasicError, Pager, PagerResult } from '@app/core';
import { IAccountBaseFacade, Account } from '@app/accounts';

export const invokeGetPagedAccounts = async (
  facade: IAccountBaseFacade,
  pager: Pager,
): Promise<Result<PagerResult<Account>, BasicError>> => {
  return facade.getPagedAccounts(pager, { via: 'inMemory' });
};
