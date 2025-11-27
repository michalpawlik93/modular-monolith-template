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
  CREATE_ACCOUNT_COMMAND_TYPE,
  CreateAccountCommand,
  CreateAccountResponse,
} from '../handlers/createAccountCommandHandler';
import {
  GET_PAGED_ACCOUNTS_COMMAND,
  GetPagedAccountsCommand,
} from '../handlers/getPagedAccountsCommandHandler';
import { Account } from '../../../domain';

export const ACCOUNT_FACADE_TOKENS = {
  Base: Symbol.for('AccountBaseFacade'),
} as const;

export interface IAccountBaseFacade {
  invokeCreateAccount(
    payload: CreateAccountCommand,
    opts?: { via?: Transport },
  ): Promise<Result<CreateAccountResponse, BasicError>>;
  getPagedAccounts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<Account>, BasicError>>;
}

@injectable()
export class AccountBaseFacade implements IAccountBaseFacade {
  constructor(
    private readonly resolveBus: BusResolver,
  ) {}

  async invokeCreateAccount(
    payload: CreateAccountCommand,
    opts?: { via?: Transport },
  ): Promise<Result<CreateAccountResponse, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<CreateAccountCommand> = {
      type: CREATE_ACCOUNT_COMMAND_TYPE,
      payload,
    };

    return busResult.value.invoke<
      CreateAccountCommand,
      CreateAccountResponse
    >(envelope);
  }

  async getPagedAccounts(
    pager: Pager,
    opts?: { via?: Transport },
  ): Promise<Result<PagerResult<Account>, BasicError>> {
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
