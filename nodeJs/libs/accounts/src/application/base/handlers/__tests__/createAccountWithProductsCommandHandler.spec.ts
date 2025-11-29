import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import {
  ok,
  basicErr,
  notFoundErr,
  isOk,
  isErr,
  SagaState,
  SagaStatus,
} from '@app/core';
import {
  CreateAccountWithProductsCommandHandler,
  CreateAccountWithProductsCommand,
} from '../createAccountWithProductsCommandHandler';
import { AccountProductSaga } from '../../sagas/accountProductSaga';
import { IAccountRepository } from '../../../../infrastructure/prisma/account.repository';
import { AccountStatusEnum } from '../../../../domain';
import {
  CreateProductCommandContract as CreateProductCommand,
  CreateProductResponseContract as CreateProductResponse,
  IProductBaseFacade,
} from '@app/core';

class FakeSagaRepo {
  state: SagaState<any> | null = null;

  async ensureIndexes() {
    return ok(null);
  }

  async findBySagaId(type: string, sagaId: string) {
    if (this.state && this.state.type === type && this.state.sagaId === sagaId) {
      return ok(this.state);
    }
    return ok(null);
  }

  async create(initial: {
    type: string;
    sagaId: string;
    status: SagaStatus;
    data: any;
    expiresAt?: Date;
  }) {
    this.state = {
      _id: randomUUID(),
      type: initial.type,
      sagaId: initial.sagaId,
      status: initial.status,
      data: initial.data,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: initial.expiresAt,
    };
    return ok(this.state);
  }

  async save(next: SagaState<any>) {
    if (!this.state || this.state._id !== next._id || this.state.version !== next.version) {
      return notFoundErr('optimistic-lock');
    }
    this.state = { ...next, version: next.version + 1 };
    return ok(this.state);
  }
}

describe('CreateAccountWithProductsCommandHandler', () => {
  const productFacade: jest.Mocked<IProductBaseFacade> = {
    invokeCreateProduct: jest.fn(),
    getPagedProducts: jest.fn(),
  } as any;
  const accountRepository: jest.Mocked<IAccountRepository> = {
    create: jest.fn(),
    createMany: jest.fn(),
    getPaged: jest.fn(),
    update: jest.fn(),
  } as any;

  const buildCommand = (): CreateAccountWithProductsCommand => ({
    account: {
      email: 'user@example.com',
      displayName: 'Test User',
      role: 'user',
      status: AccountStatusEnum.enum.active,
    },
    products: [
      {
        name: 'Sample',
        priceCents: 1234,
      },
    ],
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates account then products through saga', async () => {
    const repo = new FakeSagaRepo();
    const saga = new AccountProductSaga(repo as any);
    const handler = new CreateAccountWithProductsCommandHandler(
      accountRepository,
      productFacade,
      saga,
    );

    accountRepository.create.mockResolvedValue(
      ok({
        id: 'acc-1',
        email: 'user@example.com',
        displayName: 'Test User',
        role: 'user',
        status: AccountStatusEnum.enum.active,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    productFacade.invokeCreateProduct.mockResolvedValue(ok({ id: 'prod-1' }));

    const result = await handler.handle({ type: '', payload: buildCommand() });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.accountId).toBe('acc-1');
      expect(result.value.productIds).toEqual(['prod-1']);
    }
    expect(repo.state?.status).toBe(SagaStatus.COMPLETED);
  });

  it('marks saga failed when account creation fails', async () => {
    const repo = new FakeSagaRepo();
    const saga = new AccountProductSaga(repo as any);
    const handler = new CreateAccountWithProductsCommandHandler(
      accountRepository,
      productFacade,
      saga,
    );

    accountRepository.create.mockResolvedValue(basicErr('failed to create'));

    const result = await handler.handle({ type: '', payload: buildCommand() });

    expect(isErr(result)).toBe(true);
    expect(repo.state?.status).toBe(SagaStatus.FAILED);
  });
});
