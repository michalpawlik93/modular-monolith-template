import * as path from 'path';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';

export type CommandBusServiceConstructor = {
  new (
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: Partial<grpc.ChannelOptions>,
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


export function loadBusProto(): BusPackage {
  const protoPath = path.resolve(
    __dirname,
    './proto/bus/v1/command_bus.proto',
  );

  const pkgDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return grpc.loadPackageDefinition(pkgDef) as unknown as BusPackage;
}
