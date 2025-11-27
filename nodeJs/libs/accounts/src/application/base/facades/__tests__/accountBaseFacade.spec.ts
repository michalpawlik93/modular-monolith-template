import 'reflect-metadata';
import { Container } from 'inversify';
import {
  ICommandBus,
  COMMAND_BUS_TOKENS,
  InMemoryServiceBus,
  makeBusResolver,
  isOk,
  isErr,
} from '@app/core';
import { AccountBaseFacade } from '../accountBaseFacade';
import { mockCreateAccountCommandHandler } from '../../../../__fixtures__/createAccountCommandHandlerMock';
import { CreateAccountCommand } from '../../handlers/createAccountCommandHandler';

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
      via: 'inMemory',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ id: payload.id });
    }
  });

  it('returns descriptive error when requested bus is missing', async () => {
    const container = setupContainer();
    const facade = new AccountBaseFacade(makeBusResolver(container));

    const result = await facade.invokeCreateAccount(payload, { via: 'grpc' });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'GrpcCommandBus is not registered in the container',
      );
    }
  });
});
