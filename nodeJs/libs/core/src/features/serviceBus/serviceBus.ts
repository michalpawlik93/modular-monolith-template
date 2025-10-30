import 'reflect-metadata';
import { injectable, inject, Container } from 'inversify';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Handler<T extends BaseCommand, R> {
  handle(command: T): Promise<R>;
}

export interface Middleware<T extends BaseCommand> {
  execute(command: T): Promise<void>;
}

export interface IServiceBus {
  use<T extends BaseCommand>(middleware: Middleware<T>): void;
  execute<T extends BaseCommand, R>(command: T): Promise<R>;
}

@injectable()
export class ServiceBus implements IServiceBus {
  private middlewares: Middleware<any>[] = [];

  constructor(@inject(Container) private container: Container) {}

  use<T extends BaseCommand>(middleware: Middleware<T>): void {
    this.middlewares.push(middleware);
  }

  async execute<T extends BaseCommand, R>(command: T): Promise<R> {
    for (const middleware of this.middlewares) {
      await middleware.execute(command);
    }

    const commandHandlerType = command.constructor.name;
    if (!this.container.isBound(commandHandlerType)) {
      throw new Error(
        `No handler registered for command: ${commandHandlerType}`
      );
    }
    const handler = this.container.get<Handler<T, R>>(commandHandlerType);
    return await handler.handle(command);
  }
}

export interface BaseCommand {
  userId: string;
  caller: string;
}
