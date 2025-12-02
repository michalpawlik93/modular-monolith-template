import 'reflect-metadata';
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
import { IAccountBaseFacade, IProductBaseFacade, IN_MEMORY_TRANSPORT } from '@app/core';

class FakeSagaRepo {
  state: SagaState<any> | null = null;

  async findBySagaId(type: string, sagaId: string) {
    if (!this.state || this.state.type !== type || this.state._id !== sagaId) {
      return notFoundErr('missing');
    }
    return ok(this.state);
  }

  async create(initial: {
    type: string;
    sagaId: string;
    status: SagaStatus;
    data: any;
    currentStep?: string;
    ttl: number;
    expiresAt?: Date;
  }) {
    this.state = {
      _id: initial.sagaId,
      type: initial.type,
      status: initial.status,
      data: initial.data,
      currentStep: initial.currentStep,
      ttl: initial.ttl,
      tempData: null,
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
  const accountFacade: jest.Mocked<IAccountBaseFacade> = {
    invokeCreateAccount: jest.fn(),
    invokeDeleteAccount: jest.fn(),
    getPagedAccounts: jest.fn(),
  };
  const productFacade: jest.Mocked<IProductBaseFacade> = {
    invokeCreateProduct: jest.fn(),
    invokeDeleteProduct: jest.fn(),
    getPagedProducts: jest.fn(),
  } as any;
  const accountRepository: jest.Mocked<IAccountRepository> = {
    create: jest.fn(),
    createMany: jest.fn(),
    getPaged: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
      accountFacade,
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

    const result = await handler.handle({ type: '', payload: buildCommand(), meta: { commandId: 'cmd-1' }  });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.accountId).toBe('acc-1');
      expect(result.value.productIds).toEqual(['prod-1']);
    }
    expect(repo.state?.status).toBe(SagaStatus.SUCCESS);
  });

  it('marks saga failed when account creation fails', async () => {
    const repo = new FakeSagaRepo();
    const saga = new AccountProductSaga(repo as any);
    const handler = new CreateAccountWithProductsCommandHandler(
      accountRepository,
      accountFacade,
      productFacade,
      saga,
    );

    accountRepository.create.mockResolvedValue(basicErr('failed to create'));

    const result = await handler.handle({ type: '', payload: buildCommand(), meta: { commandId: 'cmd-1' }  });

    expect(isErr(result)).toBe(true);
    expect(repo.state?.status).toBe(SagaStatus.COMPENSATED);
    expect(accountFacade.invokeDeleteAccount).not.toHaveBeenCalled();
    expect(productFacade.invokeDeleteProduct).not.toHaveBeenCalled();
  });

  it('compensates created resources when product creation fails', async () => {
    const repo = new FakeSagaRepo();
    const saga = new AccountProductSaga(repo as any);
    const handler = new CreateAccountWithProductsCommandHandler(
      accountRepository,
      accountFacade,
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
    productFacade.invokeCreateProduct
      .mockResolvedValueOnce(ok({ id: 'prod-1' }))
      .mockResolvedValueOnce(basicErr('product failed'));
    accountFacade.invokeDeleteAccount.mockResolvedValue(ok({ id: 'acc-1' }));
    productFacade.invokeDeleteProduct.mockResolvedValue(ok({ id: 'prod-1' }));

    const command: CreateAccountWithProductsCommand = {
      ...buildCommand(),
      products: [
        { name: 'P1', priceCents: 100 },
        { name: 'P2', priceCents: 200 },
      ],
    };

    const result = await handler.handle({
      type: '',
      payload: command,
      meta: { commandId: 'cmd-1' },
    });

    expect(isErr(result)).toBe(true);
    expect(accountFacade.invokeDeleteAccount).toHaveBeenCalledWith(
      { id: 'acc-1' },
      { via: IN_MEMORY_TRANSPORT },
    );
    expect(productFacade.invokeDeleteProduct).toHaveBeenCalledWith(
      { id: 'prod-1' },
      { via: IN_MEMORY_TRANSPORT },
    );
    expect(repo.state?.status).toBe(SagaStatus.COMPENSATED);
  });
});
