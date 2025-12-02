import { isOk, isErr } from '@app/core';
import { AccountRepository } from '../account.repository';
import { AccountStatusEnum } from '../../../domain/models/account';
import { accountsDb, runInAccountsTx } from '../tx';

jest.mock('../tx', () => ({
  accountsDb: jest.fn(),
  runInAccountsTx: jest.fn(),
}));

const accountsDbMock = accountsDb as unknown as jest.Mock;
const runInAccountsTxMock = runInAccountsTx as unknown as jest.Mock;

describe('AccountRepository', () => {
  const now = new Date('2024-01-01T00:00:00Z');
  let dbMock: {
    account: {
      upsert: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const createRepo = () => new AccountRepository();

  beforeEach(() => {
    jest.clearAllMocks();
    dbMock = {
      account: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    accountsDbMock.mockReturnValue(dbMock);
    runInAccountsTxMock.mockImplementation(async (fn: () => Promise<any>) =>
      fn(),
    );
  });

  it('creates an account', async () => {
    dbMock.account.upsert.mockResolvedValue({
      id: 'acc-1',
      email: 'user@example.com',
      displayName: 'User',
      role: null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    const repo = createRepo();

    const result = await repo.create({
      id: 'acc-1',
      email: 'user@example.com',
      displayName: 'User',
      role: undefined,
      status: AccountStatusEnum.enum.active,
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({
        id: 'acc-1',
        email: 'user@example.com',
        displayName: 'User',
        role: undefined,
        status: AccountStatusEnum.enum.active,
        createdAt: now,
        updatedAt: now,
      });
    }
    expect(dbMock.account.upsert).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      update: {
        email: 'user@example.com',
        displayName: 'User',
        role: undefined,
        status: AccountStatusEnum.enum.active,
      },
      create: {
        id: 'acc-1',
        email: 'user@example.com',
        displayName: 'User',
        role: undefined,
        status: AccountStatusEnum.enum.active,
      },
    });
  });

  it('returns error when create fails', async () => {
    dbMock.account.upsert.mockRejectedValue(new Error('db down'));
    const repo = createRepo();

    const result = await repo.create({
      id: 'acc-1',
      email: 'user@example.com',
      displayName: 'User',
      role: undefined,
      status: AccountStatusEnum.enum.active,
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Failed to create account: db down');
    }
  });

  it('creates many accounts inside transaction', async () => {
    dbMock.account.upsert
      .mockResolvedValueOnce({
        id: 'a1',
        email: 'u1@example.com',
        displayName: 'U1',
        role: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })
      .mockResolvedValueOnce({
        id: 'a2',
        email: 'u2@example.com',
        displayName: 'U2',
        role: 'admin',
        status: 'disabled',
        createdAt: now,
        updatedAt: now,
      });
    const repo = createRepo();

    const result = await repo.createMany([
      {
        id: 'a1',
        email: 'u1@example.com',
        displayName: 'U1',
        role: undefined,
        status: AccountStatusEnum.enum.active,
      },
      {
        id: 'a2',
        email: 'u2@example.com',
        displayName: 'U2',
        role: 'admin',
        status: AccountStatusEnum.enum.disabled,
      },
    ]);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe('a1');
      expect(result.value[1].status).toBe(AccountStatusEnum.enum.disabled);
    }
    expect(runInAccountsTxMock).toHaveBeenCalled();
    expect(dbMock.account.upsert).toHaveBeenCalledTimes(2);
  });

  it('returns ok for empty createMany payload', async () => {
    const repo = createRepo();

    const result = await repo.createMany([]);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual([]);
    }
    expect(runInAccountsTxMock).not.toHaveBeenCalled();
  });

  it('returns error when createMany fails', async () => {
    runInAccountsTxMock.mockImplementation(async () => {
      throw new Error('tx fail');
    });
    const repo = createRepo();

    const result = await repo.createMany([
      {
        id: 'a1',
        email: 'u1@example.com',
        displayName: 'U1',
        role: undefined,
        status: AccountStatusEnum.enum.active,
      },
    ]);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'Failed to create accounts: tx fail',
      );
    }
  });

  it('paginates accounts', async () => {
    dbMock.account.findMany.mockResolvedValue([
      {
        id: 'a1',
        email: 'u1@example.com',
        displayName: 'U1',
        role: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'a2',
        email: 'u2@example.com',
        displayName: 'U2',
        role: null,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const repo = createRepo();

    const result = await repo.getPaged({ pageSize: 1, cursor: 'a0' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.data).toHaveLength(1);
      expect(result.value.cursor).toBe('a1');
    }
    expect(dbMock.account.findMany).toHaveBeenCalledWith({
      take: 2,
      skip: 1,
      cursor: { id: 'a0' },
      orderBy: { id: 'asc' },
    });
  });

  it('returns empty page when no accounts found', async () => {
    dbMock.account.findMany.mockResolvedValue([]);
    const repo = createRepo();

    const result = await repo.getPaged({ pageSize: 5 });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ data: [], cursor: undefined });
    }
  });

  it('updates account', async () => {
    dbMock.account.update.mockResolvedValue({
      id: 'a1',
      email: 'new@example.com',
      displayName: 'New',
      role: 'admin',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    const repo = createRepo();

    const result = await repo.update('a1', { displayName: 'New' });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.displayName).toBe('New');
    }
    expect(dbMock.account.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { displayName: 'New' },
    });
  });

  it('returns error when update fails', async () => {
    dbMock.account.update.mockRejectedValue(new Error('boom'));
    const repo = createRepo();

    const result = await repo.update('a1', { displayName: 'New' });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'Error when updating account with id a1: boom',
      );
    }
  });

  it('deletes account', async () => {
    dbMock.account.delete.mockResolvedValue({
      id: 'a1',
      email: 'user@example.com',
      displayName: 'User',
      role: null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    const repo = createRepo();

    const result = await repo.delete('a1');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.id).toBe('a1');
    }
    expect(dbMock.account.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });

  it('returns error when delete fails', async () => {
    dbMock.account.delete.mockRejectedValue(new Error('delete fail'));
    const repo = createRepo();

    const result = await repo.delete('a1');

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Failed to delete account a1: delete fail');
    }
  });
});
