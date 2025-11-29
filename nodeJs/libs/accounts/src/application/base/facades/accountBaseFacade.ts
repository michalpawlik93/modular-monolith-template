import 'reflect-metadata';
import { injectable } from 'inversify';
import {
  BusResolver,
  Transport,
  Envelope,
  Result,
  BasicError,
  isErr,
  Pager,
  PagerResult,
} from '@app/core';
import {
  CreateAccountCommandContract,
  CreateAccountResponseContract,
  CreateAccountWithProductsCommandContract,
  CreateAccountWithProductsResponseContract,
  IAccountBaseFacade,
  AccountContract,
} from '@app/core';
import {
  CREATE_ACCOUNT_COMMAND_TYPE,
  CreateAccountCommand,
  CreateAccountResponse,
} from '../handlers/createAccountCommandHandler';
import {
  CreateAccountWithProductsCommand,
  CreateAccountWithProductsResponse,
  CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE,
} from '../handlers/createAccountWithProductsCommandHandler';
import {
  GET_PAGED_ACCOUNTS_COMMAND,
  GetPagedAccountsCommand,
} from '../handlers/getPagedAccountsCommandHandler';
import { Account } from '../../../domain';

@injectable()
export class AccountBaseFacade
  implements IAccountBaseFacade
{
  constructor(
    private readonly resolveBus: BusResolver,
  ) {}

  async invokeCreateAccount(
    payload: CreateAccountCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<CreateAccountResponseContract, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<CreateAccountCommand> = {
      type: CREATE_ACCOUNT_COMMAND_TYPE,
      payload: payload as CreateAccountCommand,
    };

    return busResult.value.invoke<
      CreateAccountCommand,
      CreateAccountResponse
    >(envelope);
  }

  async invokeCreateAccountWithProducts(
    payload: CreateAccountWithProductsCommandContract,
    opts?: { via?: Transport },
  ): Promise<
    Result<CreateAccountWithProductsResponseContract, BasicError>
  > {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<CreateAccountWithProductsCommand> = {
      type: CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE,
      payload: payload as CreateAccountWithProductsCommand,
    };

    return busResult.value.invoke<
      CreateAccountWithProductsCommand,
      CreateAccountWithProductsResponse
    >(envelope);
  }

  async getPagedAccounts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<AccountContract>, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<GetPagedAccountsCommand> = {
      type: GET_PAGED_ACCOUNTS_COMMAND,
      payload: { pager },
    };

    return busResult.value.invoke<
      GetPagedAccountsCommand,
      PagerResult<Account>
    >(envelope);
  }
}
