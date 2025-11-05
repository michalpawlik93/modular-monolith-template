import 'reflect-metadata';
import { Container } from 'inversify';
import {
  ICommandBus,
  BaseCommand,
  Handler,
  Envelope,
  Middleware,
  TYPES,
  NoHandlerErrorType,
} from '../serviceBus';
import { InMemoryServiceBus } from '../inMemoryServiceBus';
import { COMMAND_BUS_TOKENS } from '../di';
import { Result, BasicError, ok } from '../../../utils/result';

interface TestCommand extends BaseCommand {
  data: string;
}


class TestHandler implements Handler<TestCommand, { result: string }> {
  async handle(env: Envelope<TestCommand>): Promise<Result<{ result: string }, BasicError>> {
    observedPayload = env.payload;
    return ok({ result: `Handled: ${env.payload.data}` });
  }
}

class RequestChangeMiddleware implements Middleware<{ result: string }> {
  order = 1;
  async handle(env: Envelope<TestCommand>, next: () => Promise<Result<{ result: string }, BasicError>>): Promise<Result<{ result: string }, BasicError>> {
    env.payload.data = 'Changed';
    return next();
  }
}

const TEST_COMMAND_TYPE = 'test.command';

let observedPayload: TestCommand | undefined;

describe('InMemoryServiceBus', () => {
  let container: Container;
  let serviceBus: ICommandBus;

  beforeEach(() => {
    observedPayload = undefined;
    container = new Container();
    container.bind<Container>(TYPES.Container).toConstantValue(container);
    container
      .bind<ICommandBus>(COMMAND_BUS_TOKENS.CommandBus)
      .to(InMemoryServiceBus);
    container
      .bind<Handler<TestCommand, { result: string }>>(TYPES.Handler)
      .to(TestHandler)
      .inSingletonScope()
      .whenNamed(TEST_COMMAND_TYPE);
    container.bind<RequestChangeMiddleware>(TYPES.Middleware).to(
      RequestChangeMiddleware
    );

    serviceBus = container.get<ICommandBus>(COMMAND_BUS_TOKENS.CommandBus);
  });

  test('invokes a registered handler', async () => {
    const envelope: Envelope<TestCommand> = {
      type: TEST_COMMAND_TYPE,
      payload: { data: 'testData' },
    };

    const result = await serviceBus.invoke<TestCommand, { result: string }>(
      envelope
    );

    expect(result._tag).toBe('ok');
    if (result._tag === 'ok') {
      expect(result.value).toEqual({ result: 'Handled: Changed' });
    }
  });

  test('returns error when handler is missing', async () => {
    container.unbindSync(TYPES.Handler);
    const envelope: Envelope<TestCommand> = {
      type: TEST_COMMAND_TYPE,
      payload: { data: 'testData' },
    };

    const result = await serviceBus.invoke<TestCommand, { result: string }>(
      envelope
    );

    expect(result._tag).toBe('err');
    if (result._tag === 'err') {
      expect(result.error._type).toBe(NoHandlerErrorType);
    }
  });

  test('runs middleware chain before handler on invoke', async () => {
    const envelope: Envelope<TestCommand> = {
      type: TEST_COMMAND_TYPE,
      payload: { data: 'testData' },
    };

    const result = await serviceBus.invoke<TestCommand, { result: string }>(
      envelope
    );

    expect(result._tag).toBe('ok');
    expect(observedPayload?.data).toBe('Changed');
    if (result._tag === 'ok') {
      expect(result.value).toEqual({ result: 'Handled: Changed' });
    }
  });
});
