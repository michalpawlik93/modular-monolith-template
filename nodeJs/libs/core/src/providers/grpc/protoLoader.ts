import * as path from 'path';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';

export type CommandBusServiceConstructor = {
  new (
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: Partial<grpc.ClientOptions>,
  ): grpc.Client;
  service: grpc.ServiceDefinition;
};

export interface BusPackage {
  bus: {
    v1: {
      CommandBus: CommandBusServiceConstructor;
    };
  };
}

let cached: BusPackage | null = null;

export function loadBusProto(): BusPackage {
  if (cached) {
    return cached;
  }

  const protoPath = path.resolve(
    __dirname,
    './proto/bus/v1/command_bus.proto',
  );

  const pkgDef = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const loaded = grpc.loadPackageDefinition(pkgDef) as unknown as BusPackage;
  cached = loaded;
  return loaded;
}
