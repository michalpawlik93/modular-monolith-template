import 'reflect-metadata';
import { injectable, inject, Container } from 'inversify';
import {
  Result,
  BasicError,
  err,
  empty,
  basicErr,
} from '../../utils/result';

export interface BaseCommand {}

export interface Metadata {
  correlationId?: string;
  userId?: string;
  source?: string;
}

export interface Envelope<T extends BaseCommand = BaseCommand> {
  type: string;
  payload: T;
  meta?: Metadata;
}

export interface Handler<T extends BaseCommand = BaseCommand, R = unknown> {
  handle(env: Envelope<T>): Promise<Result<R, BasicError>>;
}

export interface Middleware<R = unknown> {
  order?: number;
  handle(
    env: Envelope,
    next: () => Promise<Result<R, BasicError>>
  ): Promise<Result<R, BasicError>>;
}

export interface ICommandBus {
  dispatch<T extends BaseCommand>(
    env: Envelope<T>
  ): Promise<Result<null, BasicError>>;
  invoke<T extends BaseCommand, R = unknown>(
    env: Envelope<T>,
    opts?: { timeoutMs?: number }
  ): Promise<Result<R, BasicError>>;
}

export const TYPES = {
  Container: Symbol('Container'),
  Handler: Symbol('Handler'),
  Middleware: Symbol('Middleware'),
};

export const NoHandlerErrorType = 'NoHandlerError' as const;
export const TimeoutErrorType = 'TimeoutError' as const;

export const noHandlerErr = (type: string) =>
  err<BasicError>({
    _type: NoHandlerErrorType,
    message: `No handler registered for command type: ${type}`,
  });

export const timeoutErr = (type: string, ms: number) =>
  err<BasicError>({
    _type: TimeoutErrorType,
    message: `Command timed out after ${ms}ms: ${type}`,
  });

const safe = async <R>(
  op: () => Promise<Result<R, BasicError>>
): Promise<Result<R, BasicError>> => {
  try {
    return await op();
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return basicErr(`Unhandled runtime error: ${message}`);
  }
};

@injectable()
export class InMemoryServiceBus implements ICommandBus {
  constructor(@inject(TYPES.Container) private readonly container: Container) {}

  async dispatch<T extends BaseCommand>(
    env: Envelope<T>
  ): Promise<Result<null, BasicError>> {
    const chain = this.resolveMiddlewares<null>();
    return safe(async () =>
      this.runPipeline(chain, env, async () => {
        const handled = await this.invokeHandler<T, unknown>(env);
        if (handled._tag === 'err') {
          return handled as Result<null, BasicError>;
        }
        const messages = handled.messages;
        return empty(messages);
      })
    );
  }

  async invoke<T extends BaseCommand, R = unknown>(
    env: Envelope<T>,
    opts?: { timeoutMs?: number }
  ): Promise<Result<R, BasicError>> {
    const chain = this.resolveMiddlewares<R>();
    const timeoutMs = opts?.timeoutMs ?? 5000;

    return safe(async () =>
      this.withTimeout(env.type, timeoutMs, () =>
        this.runPipeline(chain, env, () => this.invokeHandler<T, R>(env))
      )
    );
  }

  private resolveMiddlewares<R>(): Middleware<R>[] {
    if (!this.container.isBound(TYPES.Middleware)) {
      return [];
    }
    const list = this.container.getAll<Middleware<R>>(TYPES.Middleware);
    return list.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  private async runPipeline<R>(
    middlewares: Middleware<R>[],
    env: Envelope,
    terminal: () => Promise<Result<R, BasicError>>
  ): Promise<Result<R, BasicError>> {
    let idx = -1;
    const execute = async (pointer: number): Promise<Result<R, BasicError>> => {
      if (pointer <= idx) {
        return basicErr('Middleware called next() multiple times');
      }
      idx = pointer;
      const middleware = middlewares[pointer];
      if (middleware) {
        return middleware.handle(env, () => execute(pointer + 1));
      }
      return terminal();
    };
    return execute(0);
  }

  private async invokeHandler<T extends BaseCommand, R>(
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

  private async withTimeout<R>(
    type: string,
    ms: number,
    op: () => Promise<Result<R, BasicError>>
  ): Promise<Result<R, BasicError>> {
    let timer: NodeJS.Timeout | undefined;
    const killer = new Promise<Result<R, BasicError>>((resolve) => {
      timer = setTimeout(() => resolve(timeoutErr(type, ms)), ms);
    });

    const result = await Promise.race([op(), killer]);
    if (timer) {
      clearTimeout(timer);
    }
    return result as Result<R, BasicError>;
  }
}
