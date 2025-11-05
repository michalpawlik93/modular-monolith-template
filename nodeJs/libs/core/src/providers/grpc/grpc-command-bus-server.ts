import * as grpc from '@grpc/grpc-js';
import { injectable, inject, Container } from 'inversify';
import { loadBusProto } from './protoLoader';
import {
  Envelope as CoreEnvelope,
  Handler,
  TYPES,
  noHandlerErr,
} from '../../features/serviceBus/serviceBus';
import {
  BasicError,
  Result as CoreResult,
  basicErr,
  isOk,
} from '../../utils/result';

type InvokeReq = {
  type: string;
  payload_json: string;
  meta: Record<string, string>;
};

type InvokeRes =
  | { ok: { payload_json: string } }
  | { err: { _type: string; message: string } };

@injectable()
export class GrpcCommandBusServer {
  private server: grpc.Server | null = null;

  constructor(@inject(TYPES.Container) private readonly container: Container) {}

  async start(address: string): Promise<void> {
    if (this.server) {
      return;
    }

    const pkg = loadBusProto();
    const server = new grpc.Server();

    server.addService(pkg.bus.v1.CommandBus.service, {
      Invoke: async (
        call: grpc.ServerUnaryCall<InvokeReq, InvokeRes>,
        callback: grpc.sendUnaryData<InvokeRes>,
      ) => {
        try {
          const payload_json = call.request.payload_json || '';
          const parsedPayload = safeParse(payload_json);
          
          const env: CoreEnvelope = {
            type: call.request.type,
            payload: parsedPayload,
            meta: call.request.meta ?? {},
          };

          if (!this.container.isBound(TYPES.Handler, { name: env.type })) {
            const result = noHandlerErr(env.type);
            return callback(null, toGrpcResult(result));
          }

          const handler = this.container.get<Handler>(
            TYPES.Handler,
            { name: env.type },
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

function safeParse(json: string): Record<string, unknown> {
  if (!json || json.trim() === '') {
    return {};
  }
  try {
    const parsed = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function toGrpcResult(
  res: CoreResult<unknown, BasicError>,
): InvokeRes {
  if (isOk(res)) {
    const payload_json = JSON.stringify(res.value ?? null);
    return { ok: { payload_json } };
  }
  const error = res.error ?? {
    _type: 'BasicError',
    message: 'Unknown error',
  };
  return { err: { _type: error._type, message: error.message } };
}
