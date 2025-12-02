import {
  Result,
  BasicError,
  Pager,
  PagerResult,
  IAccountBaseFacade,
  AccountContract,
  IN_MEMORY_TRANSPORT,
} from '@app/core';

export const invokeGetPagedAccounts = async (
  facade: IAccountBaseFacade,
  pager: Pager,
): Promise<Result<PagerResult<AccountContract>, BasicError>> => {
  return facade.getPagedAccounts(pager, { via: IN_MEMORY_TRANSPORT });
};
