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
  DeleteAccountCommandContract,
  DeleteAccountResponseContract,
  IAccountBaseFacade,
  AccountContract,
} from '@app/core';
import {
  CREATE_ACCOUNT_COMMAND_TYPE,
  CreateAccountCommand,
  CreateAccountResponse,
} from '../handlers/createAccountCommandHandler';
import {
  DELETE_ACCOUNT_COMMAND_TYPE,
  DeleteAccountCommand,
  DeleteAccountResponse,
} from '../handlers/deleteAccountCommandHandler';
import {
  GET_PAGED_ACCOUNTS_COMMAND,
  GetPagedAccountsCommand,
} from '../handlers/getPagedAccountsCommandHandler';
import { Account } from '../../../domain';
import { ulid } from 'ulid';

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
      meta: {commandId: ulid()},
    };

    return busResult.value.invoke<
      CreateAccountCommand,
      CreateAccountResponse
    >(envelope);
  }

  async invokeDeleteAccount(
    payload: DeleteAccountCommandContract,
    opts?: { via?: Transport },
  ): Promise<Result<DeleteAccountResponseContract, BasicError>> {
    const busResult = this.resolveBus(opts?.via);

    if (isErr(busResult)) {
      return busResult;
    }

    const envelope: Envelope<DeleteAccountCommand> = {
      type: DELETE_ACCOUNT_COMMAND_TYPE,
      payload: payload as DeleteAccountCommand,
      meta: { commandId: ulid() },
    };

    return busResult.value.invoke<
      DeleteAccountCommand,
      DeleteAccountResponse
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
      meta: {commandId: ulid()},
    };

    return busResult.value.invoke<
      GetPagedAccountsCommand,
      PagerResult<Account>
    >(envelope);
  }
}
