import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Container } from 'inversify';
import {
  COMMAND_BUS_TOKENS,
  ICommandBus,
  isOk,
  BasicError,
  Result,
} from '@app/core';
import {
  CreateLookupCommand,
  CreateLookupResponse,
} from '@app/lookup';
import { invokeCreateLookup } from './commands/invokeCreateLookup';
import { invokeCreateLookupGrpc } from './commands/invokeCreateLookupGrpc';

class ConsoleApp {
  private readonly bus: ICommandBus;
  private readonly rabbitEnabled: boolean;

  constructor(private readonly container: Container) {
    this.bus = container.get<ICommandBus>(COMMAND_BUS_TOKENS.CommandBus);
  }

  async run(): Promise<void> {
    const rl = createInterface({ input, output });
    let exit = false;

    while (!exit) {
      console.log('\n=== Lookup Console ===');
      console.log('1. Invoke create lookup');
      console.log('2. Invoke create lookup (gRPC)');
      console.log('0. Exit');

      const choice = (await rl.question('Select option: ')).trim();

      switch (choice) {
        case '1':
          await this.handleInvoke();
          break;
        case '2':
          await this.handleInvokeGrpc();
          break;
        case '0':
          exit = true;
          break;
        default:
          console.log('Unknown option. Please try again.');
      }
    }

    rl.close();
  }

  private buildPayload(): CreateLookupCommand {
    return {
      id: `console-${Date.now()}`,
      value: 'Console sample lookup',
      type: 'console',
      shortName: 'CONSOLE',
    };
  }
  private async handleInvoke(): Promise<void> {
    const payload = this.buildPayload();
    console.log('Invoking CreateLookupCommand with payload:', payload);

    const result = await invokeCreateLookup(this.bus, payload);
    this.logInvokeResult(result);
  }

  private async handleInvokeGrpc(): Promise<void> {
    const payload = this.buildPayload();
    console.log('Invoking CreateLookupCommand (gRPC) with payload:', payload);

    const result = await invokeCreateLookupGrpc(this.container, payload);
    this.logInvokeResult(result);
  }

  private logInvokeResult(
    result: Result<CreateLookupResponse, BasicError>
  ): void {
    if (isOk(result)) {
      console.log('Invoke succeeded. Created lookup:', result.value);
    } else {
      console.error(
        `Invoke failed: [${result.error._type}] ${result.error.message}`
      );
    }
  }
}

export const runConsole = async (container: Container): Promise<void> => {
  const app = new ConsoleApp(container);
  await app.run();
};
