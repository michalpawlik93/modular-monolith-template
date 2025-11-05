import 'reflect-metadata';
import * as grpc from '@grpc/grpc-js';
import { injectable, inject, Container } from 'inversify';
import { loadBusProto, BusPackage } from '../../providers/grpc/protoLoader';
import {
  BaseServiceBus,
  Envelope,
  BaseCommand,
  TYPES,
} from './serviceBus';
import {
  Result,
  BasicError,
  ok,
  err,
  basicErr,
} from '../../utils/result';

export interface GrpcRoutingConfig {
  modules: Record<string, string>;
  defaultTimeoutMs?: number;
}

type InvokeReq = {
  type: string;
  payload_json: string;
  meta: Record<string, string>;
};

type InvokeRes =
  | { ok: { payload_json: string } }
  | { err: { _type: string; message: string } };

type CommandBusClient = grpc.Client & {
  Invoke(
    request: InvokeReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (error: grpc.ServiceError | null, response: InvokeRes | undefined) => void,
  ): void;
};

@injectable()
export class GrpcServiceBus extends BaseServiceBus {
  private readonly clients = new Map<string, CommandBusClient>();//TODO: use DI
  private readonly pkg: BusPackage = loadBusProto();//TODO: use DI

  constructor(
    @inject('GrpcRoutingConfig') private readonly cfg: GrpcRoutingConfig,
    @inject(TYPES.Container) container: Container,
  ) {
    super(container);
  }

  protected async invokeHandler<T extends BaseCommand, R>(
    env: Envelope<T>,
  ): Promise<Result<R, BasicError>> {
    const { module, address } = this.resolveTarget(env.type);
    if (!address) {
      return basicErr(
        `No gRPC endpoint configured for module: ${module}`,
      );
    }

    const client = this.getClient(address);
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
      payload_json: JSON.stringify(env.payload ?? {}),
      meta: (env.meta ?? {}) as Record<string, string>,
    };

    try {
      const response = await new Promise<InvokeRes | undefined>((resolve, reject) => {
        client.Invoke(
          request,
          metadata,
          { deadline },
          (error: grpc.ServiceError | null, res: InvokeRes | undefined) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(res);
          },
        );
      });

      if (!response) {
        return basicErr('Empty gRPC response');
      }

      if ('ok' in response && response.ok) {
        return ok(this.parsePayload<R>(response.ok.payload_json));
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
      return basicErr(
        `gRPC invoke failed for ${env.type}: ${message}`,
      );
    }
  }

  private resolveTarget(type: string): { module: string; address?: string } {
    const module = type.split('.')[0] ?? '';
    let address = this.cfg.modules[module];
    
    // If no address found for the module, fallback to Core
    if (!address) {
      address = this.cfg.modules.Core;
    }
    
    return { module, address };
  }

  private getClient(address: string) {
    let client = this.clients.get(address);
    if (!client) {
      const CommandBusCtor = this.pkg.bus.v1.CommandBus;
      client = new CommandBusCtor(
        address,
        grpc.credentials.createInsecure(),
      ) as CommandBusClient;
      this.clients.set(address, client);
    }
    return client;
  }

  private parsePayload<R>(json: string): R {
    if (!json) {
      return null as R;
    }
    try {
      return JSON.parse(json) as R;
    } catch {
      return null as R;
    }
  }
}
