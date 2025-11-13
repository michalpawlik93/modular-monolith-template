import * as grpc from '@grpc/grpc-js';
import { injectable, inject, Container, optional } from 'inversify';
import { loadBusProto } from './protoLoader';
import {
  Envelope as CoreEnvelope,
  Handler,
  TYPES,
  noHandlerErr,
} from '../../features/serviceBus/serviceBus';
import {
  BasicError,
  Result,
  basicErr,
  isOk,
} from '../../utils/result';
import { isHandlerBound, getHandler } from '../../utils/inversify';
import { parseGrpcPayload } from './grpcParser';
import { mapGrpcCompression } from './grpcCompression';
import type { GrpcServerConfig } from './grpcConfig';

export type InvokeReq = {
  type: string;
  payload: Buffer | Uint8Array;
  meta: Record<string, string>;
};

export type InvokeRes =
  | { ok: { payload: Buffer } }
  | { err: { _type: string; message: string } };

export const GRPC_SERVER_CONFIG_TOKEN = Symbol.for('GrpcServerConfig');

@injectable()
export class GrpcCommandBusServer {
  private server: grpc.Server | null = null;
  constructor(
    @inject(Container) protected readonly container: Container,
    @inject(GRPC_SERVER_CONFIG_TOKEN)
    @optional()
    private readonly serverConfig?: GrpcServerConfig,
  ) {}

  private buildServerOptions(): grpc.ServerOptions {
    const options: grpc.ServerOptions = {};
    const config = this.serverConfig;

    if (config?.maxReceiveMessageLength) {
      options['grpc.max_receive_message_length'] =
        config.maxReceiveMessageLength;
    }
    if (config?.maxSendMessageLength) {
      options['grpc.max_send_message_length'] =
        config.maxSendMessageLength;
    }

    const compression = mapGrpcCompression(config?.compression);
    if (compression !== undefined) {
      options['grpc.default_compression_algorithm'] = compression;
    }

    return options;
  }

  async start(address: string): Promise<void> {
    if (this.server) {
      return;
    }

    const pkg = loadBusProto();
    const server = new grpc.Server(this.buildServerOptions());

    server.addService(pkg.bus.v1.CommandBus.service, {
      Invoke: async (
        call: grpc.ServerUnaryCall<InvokeReq, InvokeRes>,
        callback: grpc.sendUnaryData<InvokeRes>,
      ) => {
        try {
          const parsedPayload = parseGrpcPayload<Record<string, unknown>>(
            call.request.payload,
          ) ?? {};
          
          const env: CoreEnvelope = {
            type: call.request.type,
            payload: parsedPayload,
            meta: call.request.meta ?? {},
          };

          if (!isHandlerBound(this.container, TYPES.Handler, env.type)) {
            const result = noHandlerErr(env.type);
            return callback(null, toGrpcResult(result));
          }

          const handler = getHandler<Handler>(
            this.container,
            TYPES.Handler,
            env.type,
          );
          const result = await handler.handle(env);
          return callback(null, toGrpcResult(result));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown';
          const errResult = basicErr(
            `Unhandled server error: ${message}`,
          );
          return callback(null, toGrpcResult(errResult));
        }
      },
    });

    await new Promise<void>((resolve, reject) => {
      server.bindAsync(
        address,
        grpc.ServerCredentials.createInsecure(),
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          server.start();
          this.server = server;
          resolve();
        },
      );
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }
    const current = this.server;
    this.server = null;
    await new Promise<void>((resolve) =>
      current.tryShutdown(() => resolve()),
    );
  }
}

function toGrpcResult(
  res: Result<unknown, BasicError>,
): InvokeRes {
  if (isOk(res)) {
    const payload = Buffer.from(
      JSON.stringify(res.value ?? null),
      'utf-8',
    );
    return { ok: { payload } };
  }
  const error = res.error ?? {
    _type: 'BasicError',
    message: 'Unknown error',
  };
  return { err: { _type: error._type, message: error.message } };
}
