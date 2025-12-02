import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { inject, injectable } from 'inversify';
import {
  Handler,
  Envelope,
  BaseCommand,
  Result,
  BasicError,
  ok,
  basicErr,
  isErr,
} from '@app/core';
import {
  ACCOUNT_REPOSITORY_KEY,
  IAccountRepository,
} from '../../../infrastructure/prisma/account.repository';
import { Account, AccountStatusEnum } from '../../../domain';

export const CREATE_ACCOUNT_COMMAND_TYPE = 'account.create';

export interface CreateAccountCommand extends BaseCommand {
  id?: string;
  email: string;
  displayName: string;
  role?: string;
  status?: Account['status'];
}

export interface CreateAccountResponse {
  id: string;
}

@injectable()
export class CreateAccountCommandHandler
  implements Handler<CreateAccountCommand, CreateAccountResponse>
{
  constructor(
    @inject(ACCOUNT_REPOSITORY_KEY)
    private readonly repo: IAccountRepository,
  ) {}

  async handle(
    env: Envelope<CreateAccountCommand>,
  ): Promise<Result<CreateAccountResponse, BasicError>> {
    const { id, email, displayName, role, status } = env.payload;
    const statusValue = AccountStatusEnum.parse(
      status ?? AccountStatusEnum.enum.active,
    );
    const createResult = await this.repo.create({
      id: id ?? randomUUID(),
      email,
      displayName,
      role,
      status: statusValue,
    });
    if (isErr(createResult)) {
      return createResult;
    }
    return ok({ id: createResult.value.id });
  }
}
