import {
  BasicError,
  Pager,
  PagerResult,
  Result,
} from '../../../utils';
import { Transport } from '../../serviceBus/resolveBus';

export const ACCOUNT_FACADE_TOKEN = Symbol.for('AccountBaseFacade');

export interface AccountContract {
  id: string;
  email: string;
  displayName: string;
  role?: string;
  status: string;
}

export interface CreateAccountCommandContract {
  id?: string;
  email: string;
  displayName: string;
  role?: string;
}

export interface CreateAccountResponseContract {
  id: string;
}

export interface CreateAccountWithProductsCommandContract {
  commandId?: string;
  account: Omit<AccountContract, 'status'> & { status?: string };
  products?: Array<{
    id?: string;
    name: string;
    priceCents: number;
  }>;
}

export interface CreateAccountWithProductsResponseContract {
  accountId: string;
  productIds: string[];
}

export interface IAccountBaseFacade {
  invokeCreateAccount(
    payload: CreateAccountCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<CreateAccountResponseContract, BasicError>>;
  invokeCreateAccountWithProducts: (
    payload: CreateAccountWithProductsCommandContract,
    opts?: { via?: Transport },
  ) => Promise<Result<CreateAccountWithProductsResponseContract, BasicError>>;
  getPagedAccounts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<AccountContract>, BasicError>>;
}
