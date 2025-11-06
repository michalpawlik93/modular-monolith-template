import 'reflect-metadata';
import { injectable, inject, Container } from 'inversify';
import {
  Result,
  BasicError,
} from '../../utils/result';
import {
  BaseCommand,
  Envelope,
  Handler,
  BaseServiceBus,
  TYPES,
  noHandlerErr,
} from './serviceBus';

@injectable()
export class InMemoryServiceBus extends BaseServiceBus {
  constructor(@inject(Container) protected readonly container: Container) {
    super(container);
  }

  protected async invokeHandler<T extends BaseCommand, R>(
    env: Envelope<T>
  ): Promise<Result<R, BasicError>> {
    if (!this.container.isBound(TYPES.Handler, { name: env.type })) {
      return noHandlerErr(env.type);
    }
    const handler = this.container.get<Handler<T, R>>(
      TYPES.Handler,
      { name: env.type }
    );
    return handler.handle(env);
  }
}

