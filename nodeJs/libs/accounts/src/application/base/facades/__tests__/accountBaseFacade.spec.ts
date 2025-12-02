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
} from '@app/core';
import { AccountBaseFacade } from '../accountBaseFacade';
import { mockCreateAccountCommandHandler, mockDeleteAccountCommandHandler } from '../../../../__fixtures__';
import { CreateAccountCommand } from '../../handlers/createAccountCommandHandler';
import { DeleteAccountCommand } from '../../handlers/deleteAccountCommandHandler';

describe('AccountBaseFacade', () => {
  const payload: CreateAccountCommand = {
    id: 'facade-test',
    email: 'facade@example.com',
    displayName: 'Facade User',
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

  it('invokes create account via in-memory bus', async () => {
    const container = setupContainer();
    mockCreateAccountCommandHandler(container);
    const facade = new AccountBaseFacade(makeBusResolver(container));

    const result = await facade.invokeCreateAccount(payload, {
      via: IN_MEMORY_TRANSPORT,
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ id: payload.id });
    }
  });

  it('returns descriptive error when requested bus is missing', async () => {
    const container = setupContainer();
    const facade = new AccountBaseFacade(makeBusResolver(container));

    const result = await facade.invokeCreateAccount(payload, { via: GRPC_TRANSPORT });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'GrpcCommandBus is not registered in the container',
      );
    }
  });

  it('invokes delete account via in-memory bus', async () => {
    const container = setupContainer();
    mockDeleteAccountCommandHandler(container);
    const facade = new AccountBaseFacade(makeBusResolver(container));

    const deletePayload: DeleteAccountCommand = { id: payload.id };

    const result = await facade.invokeDeleteAccount(deletePayload, {
      via: IN_MEMORY_TRANSPORT,
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ id: deletePayload.id });
    }
  });
});
