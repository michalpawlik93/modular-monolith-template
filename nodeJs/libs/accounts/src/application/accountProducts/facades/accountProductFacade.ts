import 'reflect-metadata';
import { injectable } from 'inversify';
import {
  BusResolver,
  Transport,
  Envelope,
  Result,
  BasicError,
  isErr,
} from '@app/core';
import {
  CreateAccountWithProductsCommandContract,
  CreateAccountWithProductsResponseContract,
  IAccountProductsFacade,
} from '@app/core';
import {
  CreateAccountWithProductsCommand,
  CreateAccountWithProductsResponse,
  CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE,
} from '../handlers/createAccountWithProductsCommandHandler';
import { ulid } from 'ulid';

@injectable()
export class AccountProductsFacade
  implements IAccountProductsFacade
{
  constructor(
    private readonly resolveBus: BusResolver,
  ) {}

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
      meta: {commandId: ulid()},
    };

    return busResult.value.invoke<
      CreateAccountWithProductsCommand,
      CreateAccountWithProductsResponse
    >(envelope);
  }
}
