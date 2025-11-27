import {
  BaseCommand,
  BasicError,
  Envelope,
  Handler,
  Pager,
  PagerResult,
  Result,
  isErr,
} from '@app/core';
import {
  IAccountRepository,
  ACCOUNT_REPOSITORY_KEY,
} from '../../../infrastructure/prisma/account.repository';
import { Account } from '../../../domain/models/account';
import { inject, injectable } from 'inversify';

export interface GetPagedAccountsCommand extends BaseCommand {
  pager: Pager;
}

export const GET_PAGED_ACCOUNTS_COMMAND = 'account.getPaged';

@injectable()
export class GetPagedAccountsCommandHandler
  implements
    Handler<GetPagedAccountsCommand, PagerResult<Account>>
{
  constructor(
    @inject(ACCOUNT_REPOSITORY_KEY)
    private accountRepository: IAccountRepository,
  ) {}

  async handle(
    env: Envelope<GetPagedAccountsCommand>
  ): Promise<Result<PagerResult<Account>, BasicError>> {
    const { pager } = env.payload;
    const result = await this.accountRepository.getPaged(pager);

    if (isErr(result)) {
      return result;
    }

    return result;
  }
}
