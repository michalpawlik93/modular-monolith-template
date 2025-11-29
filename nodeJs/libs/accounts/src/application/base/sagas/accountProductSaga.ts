import 'reflect-metadata';
import { injectable } from 'inversify';
import {
  BaseSaga,
  MongoSagaRepository,
  SagaState,
  SagaStatus,
  Result,
  BasicError,
  ok,
  basicErr,
} from '@app/core';
import { Account } from '../../../domain';

export interface AccountProductSagaData {
  account: {
    id: string;
    email: string;
    displayName: string;
    role?: string;
    status: Account['status'];
  };
  products: Array<{
    id: string;
    name: string;
    priceCents: number;
  }>;
  accountId?: string;
  productIds: string[];
  lastError?: string;
}

@injectable()
export class AccountProductSaga extends BaseSaga<AccountProductSagaData> {
  protected readonly type = 'AccountProductSaga';

  constructor(repo: MongoSagaRepository<AccountProductSagaData>) {
    super(repo);
  }

  loadOrStartForCommand(
    commandId: string,
    initialData: AccountProductSagaData,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    return this.loadOrStart(commandId, initialData);
  }

  async onAccountCreated(
    saga: SagaState<AccountProductSagaData>,
    accountId: string,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    return this.updateState(saga, {
      data: { accountId },
    });
  }

  async onProductCreated(
    saga: SagaState<AccountProductSagaData>,
    productId: string,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    const productIds = new Set(saga.data.productIds ?? []);
    productIds.add(productId);
    return this.updateState(saga, {
      data: { productIds: Array.from(productIds) },
    });
  }

  async markCompleted(
    saga: SagaState<AccountProductSagaData>,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    return this.updateState(saga, { status: SagaStatus.COMPLETED });
  }

  async markFailed(
    saga: SagaState<AccountProductSagaData>,
    reason: string,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    return this.updateState(saga, {
      status: SagaStatus.FAILED,
      data: { lastError: reason },
    });
  }

  toResult(
    saga: SagaState<AccountProductSagaData>,
  ): Result<
    { accountId: string; productIds: string[] },
    BasicError
  > {
    if (saga.status === SagaStatus.FAILED) {
      return basicErr(
        saga.data.lastError ??
          'Saga failed and cannot produce a successful result',
      );
    }

    return ok({
      accountId: saga.data.accountId ?? saga.data.account.id,
      productIds: saga.data.productIds ?? [],
    });
  }
}
