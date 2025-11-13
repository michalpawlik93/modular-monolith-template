import 'reflect-metadata';
import * as grpc from '@grpc/grpc-js';
import { injectable, inject, Container } from 'inversify';
import { BaseServiceBus, Envelope, BaseCommand } from './serviceBus';
import { Result, BasicError, ok, err, basicErr } from '../../utils/result';
import { GrpcClientFactory, type CommandBusClient } from '../../providers/grpc/grpcClientFactory';
import { parseGrpcPayload, encodeGrpcPayload } from '../../providers/grpc/grpcParser';
import type { GrpcRoutingConfig } from '../../providers/grpc/grpcConfig';

type InvokeReq = {
  type: string;
  payload: Buffer;
  meta: Record<string, string>;
};

type InvokeRes =
  | { ok: { payload: Buffer } }
  | { err: { _type: string; message: string } };

export const GRPC_SERVICE_BUS_TOKENS = {
  ClientFactory: Symbol.for('GrpcClientFactory'),
} as const;

const RETRYABLE_CODES: ReadonlySet<number> = new Set([
  grpc.status.UNAVAILABLE,
  grpc.status.RESOURCE_EXHAUSTED,
  grpc.status.DEADLINE_EXCEEDED,
]);

@injectable()
export class GrpcServiceBus extends BaseServiceBus {
  constructor(
    @inject('GrpcRoutingConfig') private readonly cfg: GrpcRoutingConfig,
    @inject(Container) container: Container,
    @inject(GRPC_SERVICE_BUS_TOKENS.ClientFactory)
    private readonly clientFactory: GrpcClientFactory,
  ) {
    super(container);
  }

  protected async invokeHandler<T extends BaseCommand, R>(
    env: Envelope<T>,
  ): Promise<Result<R, BasicError>> {
    const { module, address } = this.resolveTarget(env.type);
    if (!address) {
      return basicErr(`No gRPC endpoint configured for module: ${module}`);
    }

    const client = this.clientFactory.getClient(address);
    const timeoutMs = this.cfg.defaultTimeoutMs ?? 5000;
    const deadline = new Date(Date.now() + timeoutMs);

    const metadata = new grpc.Metadata();
    if (env.meta?.correlationId) {
      metadata.set('x-correlation-id', env.meta.correlationId);
    }
    if (env.meta?.userId) {
      metadata.set('x-user-id', env.meta.userId);
    }
    if (env.meta?.source) {
      metadata.set('x-source', env.meta.source);
    }

    const request: InvokeReq = {
      type: env.type,
      payload: encodeGrpcPayload(env.payload),
      meta: (env.meta ?? {}) as Record<string, string>,
    };

    try {
      const response = await this.invokeWithRetry(() =>
        this.callRemote(client, request, metadata, { deadline }),
      );

      if (!response) {
        return basicErr('Empty gRPC response');
      }

      if ('ok' in response && response.ok) {
        return ok(parseGrpcPayload<R>(response.ok.payload) ?? (null as R));
      }

      if ('err' in response && response.err) {
        const error = response.err;
        return err({
          _type: error._type ?? 'BasicError',
          message: error.message ?? 'Unknown',
        });
      }

      return basicErr('Invalid gRPC response');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return basicErr(`gRPC invoke failed for ${env.type}: ${message}`);
    }
  }

  private resolveTarget(type: string): { module: string; address?: string } {
    const module = type.split('.')[0] ?? '';
    let address = this.cfg.modules[module];

    if (!address) {
      address = this.cfg.modules.Core;
    }

    return { module, address };
  }

  private callRemote(
    client: CommandBusClient,
    request: InvokeReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
  ): Promise<InvokeRes | undefined> {
    return new Promise<InvokeRes | undefined>((resolve, reject) => {
      client.Invoke(request, metadata, options, (error, res) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(res);
      });
    });
  }

  private async invokeWithRetry<T>(callFn: () => Promise<T>): Promise<T> {
    const configuredAttempts = this.cfg.client?.maxRetries ?? 3;
    const maxAttempts = Math.max(1, configuredAttempts);
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      try {
        return await callFn();
      } catch (error) {
        lastError = error;
        const code = (error as grpc.ServiceError | undefined)?.code;
        if (!code || !RETRYABLE_CODES.has(code)) {
          throw error;
        }

        const delayMs = Math.min(1000 * 2 ** attempt, 5000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt += 1;
      }
    }

    throw lastError;
  }
}
