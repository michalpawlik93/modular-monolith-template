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
import { LookupBaseFacade } from '../lookupBaseFacade';
import { mockCreateLookupCommandHandler } from '../../../../__fixtures__/createLookupCommandHandlerMock';
import { CreateLookupCommand } from '../../handlers/createLookupCommandHandler';

describe('LookupBaseFacade', () => {
  const payload: CreateLookupCommand = {
    id: 'facade-test',
    value: 'Test',
    type: 'test-type',
    shortName: 'TEST',
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

  it('invokes create lookup via in-memory bus', async () => {
    const container = setupContainer();
    mockCreateLookupCommandHandler(container);
    const facade = new LookupBaseFacade(makeBusResolver(container));

    const result = await facade.invokeCreateLookup(payload, {
      via: 'inMemory',
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ id: payload.id });
    }
  });

  it('returns descriptive error when requested bus is missing', async () => {
    const container = setupContainer();
    const facade = new LookupBaseFacade(makeBusResolver(container));

    const result = await facade.invokeCreateLookup(payload, { via: 'grpc' });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'GrpcCommandBus is not registered in the container',
      );
    }
  });
});
