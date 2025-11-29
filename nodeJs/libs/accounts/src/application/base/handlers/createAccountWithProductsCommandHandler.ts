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
  IAccountRepository,
  ACCOUNT_REPOSITORY_KEY,
} from '../../../infrastructure/prisma/account.repository';
import { AccountStatusEnum } from '../../../domain';
import {
  AccountProductSaga,
  AccountProductSagaData,
} from '../sagas/accountProductSaga';
import {
  IProductBaseFacade,
  PRODUCT_FACADE_TOKEN,
} from '@app/core';

export const CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE =
  'account.createWithProducts';

export interface CreateAccountWithProductsCommand extends BaseCommand {
  commandId?: string;
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
    @inject(PRODUCT_FACADE_TOKEN)
    private readonly productFacade: IProductBaseFacade,
    @inject(AccountProductSaga)
    private readonly saga: AccountProductSaga,
  ) {}

  async handle(
    env: Envelope<CreateAccountWithProductsCommand>,
  ): Promise<Result<CreateAccountWithProductsResponse, BasicError>> {
    const payload = env.payload;

    const accountId = payload.account.id ?? randomUUID();
    if (!payload.account.email || !payload.account.displayName) {
      return basicErr('Invalid payload');
    }

    const accountStatus = AccountStatusEnum.parse(
      payload.account.status ?? AccountStatusEnum.enum.active,
    );

    const products =
      payload.products?.map((p) => ({
        id: p.id ?? randomUUID(),
        name: p.name,
        priceCents: p.priceCents,
      })) ?? [];

    const commandId = payload.commandId ?? randomUUID();

    const sagaData: AccountProductSagaData = {
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

    let sagaStateResult = await this.saga.loadOrStartForCommand(
      commandId,
      sagaData,
    );
    if (isErr(sagaStateResult)) {
      return sagaStateResult;
    }

    let sagaState = sagaStateResult.value;

    if (this.saga.isFinished(sagaState)) {
      const result = this.saga.toResult(sagaState);
      if (isErr(result)) {
        return result;
      }
      return ok(result.value);
    }

    if (!sagaState.data.accountId) {
      const createResult = await this.accountRepository.create({
        id: sagaState.data.account.id,
        email: sagaState.data.account.email,
        displayName: sagaState.data.account.displayName,
        role: sagaState.data.account.role,
        status: sagaState.data.account.status,
      });

      if (isErr(createResult)) {
        const failure = await this.saga.markFailed(
          sagaState,
          createResult.error.message,
        );
        return isErr(failure) ? failure : createResult;
      }

      const saved = await this.saga.onAccountCreated(
        sagaState,
        createResult.value.id,
      );
      if (isErr(saved)) {
        return saved;
      }
      sagaState = saved.value;
    }

    const createdProductIds = new Set(sagaState.data.productIds ?? []);
    for (const product of sagaState.data.products) {
      if (createdProductIds.has(product.id)) {
        continue;
      }

      const productResult = await this.productFacade.invokeCreateProduct(
        {
          id: product.id,
          name: product.name,
          priceCents: product.priceCents,
        },
        { via: 'inMemory' },
      );

      if (isErr(productResult)) {
        const failure = await this.saga.markFailed(
          sagaState,
          productResult.error.message,
        );
        return isErr(failure) ? failure : productResult;
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
}
