import 'reflect-metadata';
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
  SagaState,
  IN_MEMORY_TRANSPORT,
} from '@app/core';
import {
  IAccountRepository,
  ACCOUNT_REPOSITORY_KEY,
} from '../../../infrastructure/prisma/account.repository';
import { AccountStatusEnum } from '../../../domain';
import {
  AccountProductSaga,
  AccountProductSagaData,
  AccountProductSagaTempData,
} from '../sagas/accountProductSaga';
import {
  ACCOUNT_FACADE_TOKEN,
  IAccountBaseFacade,
  IProductBaseFacade,
  PRODUCT_FACADE_TOKEN,
} from '@app/core';
import { ulid } from 'ulid';

export const CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE =
  'account.createWithProducts';

export interface CreateAccountWithProductsCommand extends BaseCommand {
  account: {
    id?: string;
    email: string;
    displayName: string;
    role?: string;
    status?: string;
  };
  products?: Array<{
    id?: string;
    name: string;
    priceCents: number;
  }>;
}

export interface CreateAccountWithProductsResponse {
  accountId: string;
  productIds: string[];
}

@injectable()
export class CreateAccountWithProductsCommandHandler
  implements
    Handler<CreateAccountWithProductsCommand, CreateAccountWithProductsResponse>
{
  constructor(
    @inject(ACCOUNT_REPOSITORY_KEY)
    private readonly accountRepository: IAccountRepository,
    @inject(ACCOUNT_FACADE_TOKEN)
    private readonly accountFacade: IAccountBaseFacade,
    @inject(PRODUCT_FACADE_TOKEN)
    private readonly productFacade: IProductBaseFacade,
    @inject(AccountProductSaga)
    private readonly saga: AccountProductSaga,
  ) {}

  async handle(
    env: Envelope<CreateAccountWithProductsCommand>,
  ): Promise<Result<CreateAccountWithProductsResponse, BasicError>> {
    const payload = env.payload;

    const accountId = payload.account.id ?? ulid();

    const accountStatus = AccountStatusEnum.parse(
      payload.account.status ?? AccountStatusEnum.enum.active,
    );

    const products =
      payload.products?.map((p) => ({
        id: p.id ?? ulid(),
        name: p.name,
        priceCents: p.priceCents,
      })) ?? [];

    const sagaTempData: AccountProductSagaTempData = {
      account: {
        id: accountId,
        email: payload.account.email,
        displayName: payload.account.displayName,
        role: payload.account.role,
        status: accountStatus,
      },
      products,
      accountId: undefined,
      productIds: [],
    };

    console.log('env.meta.commandId:', env.meta.commandId);
    const sagaStateResult = await this.saga.startForCommand(
      env.meta.commandId,
      sagaTempData,
    );
    if (isErr(sagaStateResult)) {
      return sagaStateResult;
    }

    let sagaState = sagaStateResult.value;

    const sagaAccount = this.saga.sagaTempData?.account;
    if (!sagaAccount) {
      return basicErr('Saga missing account data');
    }

    const createResult = await this.accountRepository.create({
      id: sagaAccount.id,
      email: sagaAccount.email,
      displayName: sagaAccount.displayName,
      role: sagaAccount.role,
      status: sagaAccount.status,
    });

    if (isErr(createResult)) {
      return this.compensateAndFail(sagaState, createResult.error.message);
    }

    const accountSaved = await this.saga.onAccountCreated(
      sagaState,
      createResult.value.id,
    );
    if (isErr(accountSaved)) {
      return accountSaved;
    }
    sagaState = accountSaved.value;

    const createdProductIds = new Set(this.saga.sagaTempData?.productIds ?? []);
    const productsToCreate = this.saga.sagaTempData?.products ?? [];

    for (const product of productsToCreate) {
      if (createdProductIds.has(product.id)) {
        continue;
      }

      const productResult = await this.productFacade.invokeCreateProduct(
        {
          id: product.id,
          name: product.name,
          priceCents: product.priceCents,
        },
        { via:IN_MEMORY_TRANSPORT },
      );

      if (isErr(productResult)) {
        return this.compensateAndFail(sagaState, productResult.error.message);
      }

      const saved = await this.saga.onProductCreated(
        sagaState,
        productResult.value.id,
      );
      if (isErr(saved)) {
        return saved;
      }
      sagaState = saved.value;
      createdProductIds.add(productResult.value.id);
    }

    const completed = await this.saga.markCompleted(sagaState);
    if (isErr(completed)) {
      return completed;
    }

    const result = this.saga.toResult(completed.value);
    if (isErr(result)) {
      return result;
    }

    return ok(result.value);
  }

  private async compensateAndFail(
    saga: SagaState<AccountProductSagaData>,
    reason: string,
  ): Promise<Result<CreateAccountWithProductsResponse, BasicError>> {
    const compensation = await this.saga.compensate(
      saga,
      reason,
      {
        compensateProducts: async () => {
          const productIds = this.saga.sagaTempData?.productIds ?? [];
          if (productIds.length === 0) {
            return ok(undefined);
          }
          for (const productId of productIds) {
            const deleteResult = await this.productFacade.invokeDeleteProduct(
              { id: productId },
              { via: IN_MEMORY_TRANSPORT },
            );
            if (isErr(deleteResult)) {
              return basicErr(
                `Failed to delete product ${productId}: ${deleteResult.error.message}`,
              );
            }
          }
          return ok(undefined);
        },
        compensateAccount: async () => {
          const accountId = this.saga.sagaTempData?.accountId;
          if (!accountId) {
            return ok(undefined);
          }
          const deleteResult = await this.accountFacade.invokeDeleteAccount(
            { id: accountId },
            { via: IN_MEMORY_TRANSPORT },
          );
          if (isErr(deleteResult)) {
            return basicErr(
              `Failed to delete account ${accountId}: ${deleteResult.error.message}`,
            );
          }
          return ok(undefined);
        },
      },
    );

    if (isErr(compensation)) {
      return compensation;
    }

    return basicErr(reason);
  }
}
