import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import {
  Handler,
  Envelope,
  BaseCommand,
  Result,
  BasicError,
  ok,
  isErr,
} from '@app/core';
import {
  ACCOUNT_REPOSITORY_KEY,
  IAccountRepository,
} from '../../../infrastructure/prisma/account.repository';

export const DELETE_ACCOUNT_COMMAND_TYPE = 'account.delete';

export interface DeleteAccountCommand extends BaseCommand {
  id: string;
}

export interface DeleteAccountResponse {
  id: string;
}

@injectable()
export class DeleteAccountCommandHandler
  implements Handler<DeleteAccountCommand, DeleteAccountResponse>
{
  constructor(
    @inject(ACCOUNT_REPOSITORY_KEY)
    private readonly repo: IAccountRepository,
  ) {}

  async handle(
    env: Envelope<DeleteAccountCommand>,
  ): Promise<Result<DeleteAccountResponse, BasicError>> {
    const { id } = env.payload;
    const result = await this.repo.delete(id);

    if (isErr(result)) {
      return result;
    }

    return ok({ id: result.value.id });
  }
}
