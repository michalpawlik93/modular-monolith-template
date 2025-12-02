import { injectable } from 'inversify';
import {
  Result,
  BasicError,
  ok,
  basicErr,
  Pager,
  PagerResult,
  getErrorMessage,
} from '@app/core';
import { Account, AccountStatusEnum } from '../../domain/models/account';
import { accountsDb, runInAccountsTx } from './tx';

export interface IAccountRepository {
  create: (
    account: Omit<Account, 'createdAt' | 'updatedAt'>,
  ) => Promise<Result<Account, BasicError>>;
  createMany: (
    accounts: Array<Omit<Account, 'createdAt' | 'updatedAt'>>,
  ) => Promise<Result<Account[], BasicError>>;
  getPaged: (pager: Pager) => Promise<Result<PagerResult<Account>, BasicError>>;
  update: (
    id: string,
    update: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<Result<Account, BasicError>>;
  delete: (id: string) => Promise<Result<Account, BasicError>>;
}

export const ACCOUNT_REPOSITORY_KEY = Symbol.for('IAccountRepository');

const toDomain = (account: {
  id: string;
  email: string;
  displayName: string;
  role?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Account => ({
  id: account.id,
  email: account.email,
  displayName: account.displayName,
  role: account.role ?? undefined,
  status: AccountStatusEnum.parse(account.status),
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});

@injectable()
export class AccountRepository implements IAccountRepository {
  private get db() {
    return accountsDb();
  }

  async create(
    account: Omit<Account, 'createdAt' | 'updatedAt'>,
  ): Promise<Result<Account, BasicError>> {
    try {
      const created = await this.db.account.upsert({
        where: { id: account.id },
        update: {
          email: account.email,
          displayName: account.displayName,
          role: account.role,
          status: account.status,
        },
        create: {
          id: account.id,
          email: account.email,
          displayName: account.displayName,
          role: account.role,
          status: account.status,
        },
      });
      return ok(toDomain(created));
    } catch (error) {
      return basicErr(`Failed to create account: ${getErrorMessage(error)}`);
    }
  }

  async createMany(
    accounts: Array<Omit<Account, 'createdAt' | 'updatedAt'>>,
  ): Promise<Result<Account[], BasicError>> {
    if (accounts.length === 0) {
      return ok([]);
    }

    try {
      const created = await runInAccountsTx(async () => {
        const results: Account[] = [];
        for (const account of accounts) {
          const result = await this.db.account.upsert({
            where: { id: account.id },
            update: {
              email: account.email,
              displayName: account.displayName,
              role: account.role,
              status: account.status,
            },
            create: {
              id: account.id,
              email: account.email,
              displayName: account.displayName,
              role: account.role,
              status: account.status,
            },
          });
          results.push(toDomain(result));
        }
        return results;
      });

      return ok(created);
    } catch (error) {
      return basicErr(`Failed to create accounts: ${getErrorMessage(error)}`);
    }
  }

  async getPaged(
    pager: Pager,
  ): Promise<Result<PagerResult<Account>, BasicError>> {
    try {
      const { pageSize, cursor } = pager;
      const results = await this.db.account.findMany({
        take: pageSize + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      });

      if (results.length === 0) {
        return ok({ data: [], cursor: undefined });
      }

      const hasNext = results.length > pageSize;
      const page = hasNext ? results.slice(0, pageSize) : results;
      const nextCursor = hasNext ? page[page.length - 1]?.id : undefined;

      return ok({
        data: page.map(toDomain),
        cursor: nextCursor,
      });
    } catch (error) {
      return basicErr(`Failed to paginate accounts: ${getErrorMessage(error)}`);
    }
  }

  async update(
    id: string,
    update: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Result<Account, BasicError>> {
    try {
      const updated = await this.db.account.update({
        where: { id },
        data: {
          email: update.email,
          displayName: update.displayName,
          role: update.role,
          status: update.status,
        },
      });

      return ok(toDomain(updated));
    } catch (error) {
      return basicErr(
        `Error when updating account with id ${id}: ${getErrorMessage(error)}`,
      );
    }
  }

  async delete(id: string): Promise<Result<Account, BasicError>> {
    try {
      const deleted = await this.db.account.delete({ where: { id } });
      return ok(toDomain(deleted));
    } catch (error) {
      return basicErr(
        `Failed to delete account ${id}: ${getErrorMessage(error)}`,
      );
    }
  }
}
