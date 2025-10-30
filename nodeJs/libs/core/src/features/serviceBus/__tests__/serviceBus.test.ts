import 'reflect-metadata';
import { Container } from 'inversify';
import {
  ServiceBus,
  IServiceBus,
  BaseCommand,
  Handler,
  Middleware,
} from '../serviceBus';
import { SERVICE_BUS_TOKENS } from '../di';

class TestCommand implements BaseCommand {
  constructor(
    public userId: string,
    public caller: string,
    public data: string
  ) {}
}

class TestHandler implements Handler<TestCommand, { result: string }> {
  async handle(command: TestCommand) {
    return { result: `Handled: ${command.data}` };
  }
}

class RequestChangeMiddleware implements Middleware<TestCommand> {
  async execute(command: TestCommand) {
    command.data = 'Changed';
  }
}

describe('ServiceBus', () => {
  let container: Container;
  let serviceBus: IServiceBus;

  beforeEach(() => {
    container = new Container();
    container.bind<Container>(Container).toConstantValue(container);
    container.bind<IServiceBus>(SERVICE_BUS_TOKENS.ServiceBus).to(ServiceBus);
    container.bind<TestHandler>(TestCommand.name).to(TestHandler);
    container
      .bind<RequestChangeMiddleware>(SERVICE_BUS_TOKENS.Middleware)
      .to(RequestChangeMiddleware);

    serviceBus = container.get<IServiceBus>(SERVICE_BUS_TOKENS.ServiceBus);
  });

  test('should register and execute a handler', async () => {
    const command = new TestCommand('123', 'testCaller', 'testData');
    const result = await serviceBus.execute<TestCommand, { result: string }>(
      command
    );
    expect(result).toEqual({ result: 'Handled: testData' });
  });

  test('should throw an error if no handler is registered', async () => {
    const command = new TestCommand('123', 'testCaller', 'testData');
    container.unbind(TestCommand.name);

    await expect(serviceBus.execute(command)).rejects.toThrow(
      'No handler registered for command: TestCommand'
    );
  });

  test('should execute middleware before handler', async () => {
    const command = new TestCommand('123', 'testCaller', 'testData');

    serviceBus.use(
      container.get<RequestChangeMiddleware>(SERVICE_BUS_TOKENS.Middleware)
    );
    const result = await serviceBus.execute<TestCommand, { result: string }>(
      command
    );

    expect(result).toEqual({ result: 'Handled: Changed' });
  });
});
