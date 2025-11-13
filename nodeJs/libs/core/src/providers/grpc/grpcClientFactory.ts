import * as grpc from '@grpc/grpc-js';
import type { BusPackage } from './protoLoader';
import { mapGrpcCompression } from './grpcCompression';
import type { GrpcClientConfig } from './grpcConfig';

type InvokeReq = {
  type: string;
  payload: Buffer;
  meta: Record<string, string>;
};

type InvokeRes =
  | { ok: { payload: Buffer } }
  | { err: { _type: string; message: string } };

export type CommandBusClient = grpc.Client & {
  Invoke(
    request: InvokeReq,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error: grpc.ServiceError | null,
      response: InvokeRes | undefined,
    ) => void,
  ): void;
};

export class GrpcClientFactory {
  private readonly clients = new Map<string, CommandBusClient>();

  constructor(
    private readonly pkg: BusPackage,
    private readonly clientConfig?: GrpcClientConfig,
  ) {}

  getClient(address: string): CommandBusClient {
    let client = this.clients.get(address);
    if (!client) {
      const CommandBusCtor = this.pkg.bus.v1.CommandBus;
      client = new CommandBusCtor(
        address,
        grpc.credentials.createInsecure(),
        this.buildChannelOptions(),
      ) as CommandBusClient;
      this.clients.set(address, client);
    }
    return client;
  }

  private buildChannelOptions(): Partial<grpc.ChannelOptions> {
    const opts: Partial<grpc.ChannelOptions> = {};
    const clientCfg = this.clientConfig;

    if (clientCfg?.keepaliveTimeMs) {
      opts['grpc.keepalive_time_ms'] = clientCfg.keepaliveTimeMs;
    }
    if (clientCfg?.keepaliveTimeoutMs) {
      opts['grpc.keepalive_timeout_ms'] = clientCfg.keepaliveTimeoutMs;
    }
    if (clientCfg?.maxReceiveMessageLength) {
      opts['grpc.max_receive_message_length'] =
        clientCfg.maxReceiveMessageLength;
    }
    if (clientCfg?.maxSendMessageLength) {
      opts['grpc.max_send_message_length'] = clientCfg.maxSendMessageLength;
    }

    const compression = mapGrpcCompression(clientCfg?.compression);
    if (compression !== undefined) {
      opts['grpc.default_compression_algorithm'] = compression;
    }

    return opts;
  }
}

