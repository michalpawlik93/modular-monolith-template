import 'reflect-metadata';
import { Container } from 'inversify';
import { GRPC_TRANSPORT, IN_MEMORY_TRANSPORT, makeBusResolver } from '../resolveBus';
import { COMMAND_BUS_TOKENS } from '../di';
import { ICommandBus } from '../serviceBus';
import { isOk, isErr } from '../../../utils/result';
import { InMemoryServiceBus } from '../inMemoryServiceBus';

describe('makeBusResolver', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    container.bind<Container>(Container).toConstantValue(container);
  });

  it('returns ok with bus when transport is registered', () => {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.InMemory)
      .to(InMemoryServiceBus)
      .inSingletonScope();

    const resolver = makeBusResolver(container);
    const result = resolver(IN_MEMORY_TRANSPORT);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBeInstanceOf(InMemoryServiceBus);
    }
  });

  it('returns error when transport is not registered', () => {
    const resolver = makeBusResolver(container);
    const result = resolver(GRPC_TRANSPORT);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'GrpcCommandBus is not registered in the container',
      );
    }
  });

  it('returns error with correct message for grpc transport', () => {
    const resolver = makeBusResolver(container);
    const result = resolver(GRPC_TRANSPORT);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'GrpcCommandBus is not registered in the container',
      );
    }
  });

  it('returns error with correct message for inMemory transport', () => {
    const resolver = makeBusResolver(container);
    const result = resolver(IN_MEMORY_TRANSPORT);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe(
        'InMemoryCommandBus is not registered in the container',
      );
    }
  });

  it('returns error when transport is undefined', () => {
    const resolver = makeBusResolver(container);
    const result = resolver(undefined);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('Transport is required');
    }
  });

  it('returns different bus instances for different transports when registered', () => {
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.InMemory)
      .to(InMemoryServiceBus)
      .inSingletonScope();

    const resolver = makeBusResolver(container);
    const inMemoryResult = resolver(IN_MEMORY_TRANSPORT);

    expect(isOk(inMemoryResult)).toBe(true);
    if (isOk(inMemoryResult)) {
      expect(inMemoryResult.value).toBeInstanceOf(InMemoryServiceBus);
    }
  });
});

