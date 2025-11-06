import 'reflect-metadata';
import { Container } from 'inversify';
import { GrpcServiceBus, type GrpcRoutingConfig } from '../grpcServiceBus';
import { isOk, isErr } from '../../../utils/result';
import { loadBusProto } from '../../../providers/grpc/protoLoader';
import type { BusPackage } from '../../../providers/grpc/protoLoader';
import * as grpc from '@grpc/grpc-js';

jest.mock('../../../providers/grpc/protoLoader', () => ({
  loadBusProto: jest.fn(),
}));

jest.mock('@grpc/grpc-js', () => {
  const metadataMock = jest.fn().mockImplementation(() => ({
    set: jest.fn(),
  }));

  const credentialsMock = {
    createInsecure: jest.fn(() => 'insecure-credentials'),
  };

  return {
    Metadata: metadataMock,
    credentials: credentialsMock,
  };
});

const commandBusCtorMock = jest.fn();

describe('GrpcServiceBus', () => {
  let container: Container;
  let invokeImpl: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    container = new Container();
    invokeImpl = jest.fn();

    commandBusCtorMock.mockImplementation(() => ({
      Invoke: (
        request: unknown,
        metadata: unknown,
        options: unknown,
        callback: (
          error: grpc.ServiceError | null,
          response?: unknown,
        ) => void,
      ) => invokeImpl(request, metadata, options, callback),
    }));

    (loadBusProto as jest.MockedFunction<typeof loadBusProto>).mockReturnValue({
      bus: {
        v1: {
          CommandBus: commandBusCtorMock,
        },
      },
    } as unknown as BusPackage);
  });

  test('invokes gRPC client and parses successful response', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Lookup: 'localhost:50051' },
    };
    const bus = new GrpcServiceBus(cfg, container);

    invokeImpl.mockImplementation(
      (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response?: unknown) => void,
      ) => {
        callback(null, {
          ok: { payload_json: JSON.stringify({ success: true }) },
        });
      },
    );

    const result = await bus.invoke({
      type: 'Lookup.Create',
      payload: { id: '123' },
      meta: {
        correlationId: 'corr-1',
        userId: 'user-1',
        source: 'tests',
      },
    });

    expect(invokeImpl).toHaveBeenCalledTimes(1);
    const [requestArg, metadataArg, optionsArg] = invokeImpl.mock.calls[0];

    expect(requestArg).toMatchObject({
      type: 'Lookup.Create',
      payload_json: JSON.stringify({ id: '123' }),
      meta: {
        correlationId: 'corr-1',
        userId: 'user-1',
        source: 'tests',
      },
    });
    expect(optionsArg).toHaveProperty('deadline');

    const metadataMock = grpc.Metadata as unknown as jest.Mock;
    expect(metadataMock).toHaveBeenCalledTimes(1);
    const metadataInstance = metadataMock.mock.results[0].value as {
      set: jest.Mock;
    };
    expect(metadataArg).toBe(metadataInstance);
    expect(metadataInstance.set).toHaveBeenCalledWith(
      'x-correlation-id',
      'corr-1',
    );
    expect(metadataInstance.set).toHaveBeenCalledWith('x-user-id', 'user-1');
    expect(metadataInstance.set).toHaveBeenCalledWith('x-source', 'tests');

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ success: true });
    }
  });

  test('falls back to Core module when target module is missing', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Core: 'localhost:50060' },
    };
    const bus = new GrpcServiceBus(cfg, container);

    invokeImpl.mockImplementation(
      (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response?: unknown) => void,
      ) => {
        callback(null, { ok: { payload_json: 'null' } });
      },
    );

    await bus.invoke({
      type: 'Unknown.Command',
      payload: {},
    });

    expect(commandBusCtorMock).toHaveBeenCalledWith(
      'localhost:50060',
      expect.anything(),
    );
  });

  test('returns error result when gRPC invocation fails', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Lookup: 'localhost:50051' },
    };
    const bus = new GrpcServiceBus(cfg, container);

    invokeImpl.mockImplementation(
      (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response?: unknown) => void,
      ) => {
        const serviceError = Object.assign(new Error('network down'), {
          code: 13,
          details: 'network down',
          metadata: {} as grpc.Metadata,
        }) as grpc.ServiceError;
        callback(serviceError, undefined);
      },
    );

    const result = await bus.invoke({
      type: 'Lookup.Create',
      payload: {},
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain('gRPC invoke failed for Lookup.Create');
      expect(result.error.message).toContain('network down');
    }
  });

  test('returns error result when response contains domain error', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Lookup: 'localhost:50051' },
    };
    const bus = new GrpcServiceBus(cfg, container);

    invokeImpl.mockImplementation(
      (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response?: unknown) => void,
      ) => {
        callback(null, {
          err: { _type: 'ValidationError', message: 'Invalid payload' },
        });
      },
    );

    const result = await bus.invoke({
      type: 'Lookup.Create',
      payload: {},
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toEqual({
        _type: 'ValidationError',
        message: 'Invalid payload',
      });
    }
  });
});
