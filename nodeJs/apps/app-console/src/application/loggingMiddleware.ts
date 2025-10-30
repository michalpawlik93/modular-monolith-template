import { injectable } from 'inversify';
import {
  Middleware,
  Envelope,
  Result,
  BasicError,
} from '@app/core';

@injectable()
export class ConsoleLoggingMiddleware implements Middleware {
  order = 10;

  async handle(
    env: Envelope,
    next: () => Promise<Result<unknown, BasicError>>
  ): Promise<Result<unknown, BasicError>> {
    console.log(
      `[ServiceBus] -> ${env.type}`,
      JSON.stringify(env.payload),
      env.meta ? `meta=${JSON.stringify(env.meta)}` : ''
    );

    const result = await next();

    if (result._tag === 'err') {
      console.error(
        `[ServiceBus] <- ${env.type} failed`,
        result.error._type,
        result.error.message
      );
    } else {
      console.log(`[ServiceBus] <- ${env.type} succeeded`);
    }

    return result;
  }
}
