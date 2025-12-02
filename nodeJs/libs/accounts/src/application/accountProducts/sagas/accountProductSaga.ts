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
  isErr,
} from '@app/core';
import { Account } from '../../../domain';

export interface AccountProductSagaTempData {
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

export type AccountProductSagaData = null;

export enum AccountProductSagaStep {
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  CREATE_PRODUCTS = 'CREATE_PRODUCTS',
  COMPENSATE_PRODUCTS = 'COMPENSATE_PRODUCTS',
  COMPENSATE_ACCOUNT = 'COMPENSATE_ACCOUNT',
  COMPLETE = 'COMPLETE',
}

@injectable()
export class AccountProductSaga extends BaseSaga<AccountProductSagaData> {
  protected readonly type = 'AccountProductSaga';
  public sagaTempData: AccountProductSagaTempData | null = null;

  constructor(repo: MongoSagaRepository<AccountProductSagaData>) {
    super(repo);
  }

  startForCommand(
    commandId: string,
    initialTempData: AccountProductSagaTempData,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    this.sagaTempData = {
      ...initialTempData,
      account: { ...initialTempData.account },
      products: initialTempData.products.map((product) => ({ ...product })),
      productIds: [...initialTempData.productIds],
      lastError: initialTempData.lastError,
    };

    return this.start(
      commandId,
      null,
      AccountProductSagaStep.CREATE_ACCOUNT,
    );
  }

  async onAccountCreated(
    saga: SagaState<AccountProductSagaData>,
    accountId: string,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    const tempData = this.ensureTempData();
    if (isErr(tempData)) {
      return tempData;
    }

    this.sagaTempData = { ...tempData.value, accountId };

    return this.markStep(
      saga,
      AccountProductSagaStep.CREATE_PRODUCTS,
    );
  }

  async onProductCreated(
    saga: SagaState<AccountProductSagaData>,
    productId: string,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    const tempData = this.ensureTempData();
    if (isErr(tempData)) {
      return tempData;
    }

    const productIds = new Set(tempData.value.productIds ?? []);
    productIds.add(productId);
    this.sagaTempData = {
      ...tempData.value,
      productIds: Array.from(productIds),
    };

    return this.markStep(
      saga,
      AccountProductSagaStep.CREATE_PRODUCTS,
    );
  }

  async markCompleted(
    saga: SagaState<AccountProductSagaData>,
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    const withStep = await this.markStep(
      saga,
      AccountProductSagaStep.COMPLETE,
    );
    if (isErr(withStep)) {
      return withStep;
    }
    return this.markSuccess(withStep.value);
  }

  async compensate(
    saga: SagaState<AccountProductSagaData>,
    reason: string,
    opts: {
      compensateProducts: () => Promise<Result<void, BasicError>>;
      compensateAccount: () => Promise<Result<void, BasicError>>;
    },
  ): Promise<Result<SagaState<AccountProductSagaData>, BasicError>> {
    const tempData = this.ensureTempData();
    if (isErr(tempData)) {
      return tempData;
    }

    this.sagaTempData = { ...tempData.value, lastError: reason };

    let current = await this.markStep(
      saga,
      AccountProductSagaStep.COMPENSATE_PRODUCTS,
    );
    if (isErr(current)) {
      return current;
    }

    const productsComp = await opts.compensateProducts();
    if (isErr(productsComp)) {
      const failed = await this.markFailed(current.value);
      return isErr(failed)
        ? failed
        : basicErr(productsComp.error.message);
    }

    current = await this.markStep(
      current.value,
      AccountProductSagaStep.COMPENSATE_ACCOUNT,
    );
    if (isErr(current)) {
      return current;
    }

    const accountComp = await opts.compensateAccount();
    if (isErr(accountComp)) {
      const failed = await this.markFailed(current.value);
      return isErr(failed)
        ? failed
        : basicErr(accountComp.error.message);
    }

    return this.markCompensated(current.value);
  }

  toResult(
    saga: SagaState<AccountProductSagaData>,
  ): Result<
    { accountId: string; productIds: string[] },
    BasicError
  > {
    const tempData = this.ensureTempData();
    if (isErr(tempData)) {
      return tempData;
    }

    if (saga.status !== SagaStatus.SUCCESS) {
      return basicErr(
        tempData.value.lastError ??
          'Saga is not in a successful state and cannot produce a result',
      );
    }

    return ok({
      accountId: tempData.value.accountId ?? tempData.value.account.id,
      productIds: tempData.value.productIds ?? [],
    });
  }

  private ensureTempData(): Result<AccountProductSagaTempData, BasicError> {
    if (!this.sagaTempData) {
      return basicErr('Saga temp data not initialized');
    }
    return ok(this.sagaTempData);
  }
}
