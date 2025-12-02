import 'reflect-metadata';
import { Container } from 'inversify';
import {
  ICommandBus,
  COMMAND_BUS_TOKENS,
  InMemoryServiceBus,
  makeBusResolver,
  isOk,
  isErr,
  GRPC_TRANSPORT,
  IN_MEMORY_TRANSPORT,
  registerCommandHandlerMock,
  ok,
} from '@app/core';
import { AccountProductsFacade } from '../accountProductFacade';
import { CreateAccountWithProductsCommandContract } from '@app/core';
import {
  CreateAccountWithProductsCommand,
  CreateAccountWithProductsResponse,
  CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE,
} from '../../handlers/createAccountWithProductsCommandHandler';
import { ulid } from 'ulid';

describe('AccountProductsFacade', () => {
  const payload: CreateAccountWithProductsCommandContract = {
    account: {
      id: ulid(),
      email: `user${Date.now()}@example.com`,
      displayName: 'Console Account (saga)',
      role: 'user',
    },
    products: [
      {
        id: ulid(),
        name: 'Saga sample product',
        priceCents: 2999,
      },
    ],
  };

  const setupContainer = (): Container => {
    const container = new Container();
    container.bind<Container>(Container).toConstantValue(container);
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.InMemory)
      .to(InMemoryServiceBus)
      .inSingletonScope();
    return container;
  };

  it('returns descriptive error when requested bus is missing', async () => {
    const container = setupContainer();
    const facade = new AccountProductsFacade(makeBusResolver(container));

    const result = await facade.invokeCreateAccountWithProducts(payload, { via: GRPC_TRANSPORT });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'GrpcCommandBus is not registered in the container',
      );
    }
  });

  it('invokes create account with products via in-memory bus', async () => {
    const container = setupContainer();
    registerCommandHandlerMock<
      CreateAccountWithProductsCommand,
      CreateAccountWithProductsResponse
    >(container, CREATE_ACCOUNT_WITH_PRODUCTS_COMMAND_TYPE, {
      defaultResult: () =>
        ok({
          accountId: payload.account.id as string,
          productIds: (payload.products ?? []).map((p) => p.id as string),
        }),
    });
    const facade = new AccountProductsFacade(makeBusResolver(container));

    const result = await facade.invokeCreateAccountWithProducts(payload, {
      via: IN_MEMORY_TRANSPORT,
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({
        accountId: payload.account.id,
        productIds: (payload.products ?? []).map((p) => p.id as string),
      });
    }
  });
});
