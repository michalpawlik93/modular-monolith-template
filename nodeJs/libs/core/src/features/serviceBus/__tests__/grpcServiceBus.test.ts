import 'reflect-metadata';
import { Container } from 'inversify';
import { GrpcServiceBus } from '../grpcServiceBus';
import type { GrpcRoutingConfig } from '../../../providers/grpc/grpcConfig';
import { isOk, isErr } from '../../../utils/result';
import type { BusPackage } from '../../../providers/grpc/protoLoader';
import { GrpcClientFactory } from '../../../providers/grpc/grpcClientFactory';
import * as grpc from '@grpc/grpc-js';

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
    status: {
      UNAVAILABLE: 14,
      RESOURCE_EXHAUSTED: 8,
      DEADLINE_EXCEEDED: 4,
    },
    compressionAlgorithms: {
      gzip: 2,
    },
  };
});

const commandBusCtorMock = jest.fn();

describe('GrpcServiceBus', () => {
  let container: Container;
  let invokeImpl: jest.Mock;
  let busPackage: BusPackage;

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

    busPackage = {
      bus: {
        v1: {
          CommandBus: commandBusCtorMock,
        },
      },
    } as unknown as BusPackage;

  });

  test('invokes gRPC client and parses successful response', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Lookup: 'localhost:50051' },
      client: {
        keepaliveTimeMs: 30_000,
        keepaliveTimeoutMs: 10_000,
        maxReceiveMessageLength: 32 * 1024 * 1024,
        maxSendMessageLength: 32 * 1024 * 1024,
        compression: 'gzip',
        maxRetries: 3,
      },
    };
    const clientFactory = new GrpcClientFactory(busPackage, cfg.client);
    const bus = new GrpcServiceBus(cfg, container, clientFactory);

    invokeImpl.mockImplementation(
      (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response?: unknown) => void,
      ) => {
        callback(null, {
          ok: {
            payload: Buffer.from(
              JSON.stringify({ success: true }),
              'utf-8',
            ),
          },
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
        commandId: 'cmd-1',
      },
    });

    expect(invokeImpl).toHaveBeenCalledTimes(1);
    const [requestArg, metadataArg, optionsArg] = invokeImpl.mock.calls[0];

    expect(requestArg).toMatchObject({
      type: 'Lookup.Create',
      meta: {
        correlationId: 'corr-1',
        userId: 'user-1',
        source: 'tests',
      },
    });
    expect(Buffer.isBuffer(requestArg.payload)).toBe(true);
    expect(requestArg.payload.toString('utf-8')).toBe(
      JSON.stringify({ id: '123' }),
    );
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

    expect(commandBusCtorMock).toHaveBeenCalledWith(
      'localhost:50051',
      'insecure-credentials',
      expect.objectContaining({
        'grpc.keepalive_time_ms': 30_000,
        'grpc.keepalive_timeout_ms': 10_000,
        'grpc.max_receive_message_length': 32 * 1024 * 1024,
        'grpc.max_send_message_length': 32 * 1024 * 1024,
        'grpc.default_compression_algorithm':
          grpc.compressionAlgorithms.gzip,
      }),
    );

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({ success: true });
    }
  });

  test('falls back to Core module when target module is missing', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Core: 'localhost:50060' },
    };
    const clientFactory = new GrpcClientFactory(busPackage, cfg.client);
    const bus = new GrpcServiceBus(cfg, container, clientFactory);

    invokeImpl.mockImplementation(
      (
        request: unknown,
        metadata: grpc.Metadata,
        options: grpc.CallOptions,
        callback: (error: grpc.ServiceError | null, response?: unknown) => void,
      ) => {
        callback(null, { ok: { payload: Buffer.from('null', 'utf-8') } });
      },
    );

    await bus.invoke({
      type: 'Unknown.Command',
      payload: {},
      meta: { commandId: 'cmd-1' },
    });

    expect(commandBusCtorMock).toHaveBeenCalledWith(
      'localhost:50060',
      expect.anything(),
      expect.any(Object),
    );
  });

  test('returns error result when gRPC invocation fails', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Lookup: 'localhost:50051' },
    };
    const clientFactory = new GrpcClientFactory(busPackage, cfg.client);
    const bus = new GrpcServiceBus(cfg, container, clientFactory);

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
      meta: { commandId: 'cmd-1' },
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
    const clientFactory = new GrpcClientFactory(busPackage, cfg.client);
    const bus = new GrpcServiceBus(cfg, container, clientFactory);

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
      meta: { commandId: 'cmd-1' },
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toEqual({
        _type: 'ValidationError',
        message: 'Invalid payload',
      });
    }
  });

  test('retries on retryable status codes before succeeding', async () => {
    const cfg: GrpcRoutingConfig = {
      modules: { Lookup: 'localhost:50051' },
      client: {
        maxRetries: 3,
      },
    };
    const clientFactory = new GrpcClientFactory(busPackage, cfg.client);
    const bus = new GrpcServiceBus(cfg, container, clientFactory);

    const serviceError = Object.assign(new Error('unavailable'), {
      code: grpc.status.UNAVAILABLE,
    }) as grpc.ServiceError;

    invokeImpl
      .mockImplementationOnce(
        (
          _request: unknown,
          _metadata: grpc.Metadata,
          _options: grpc.CallOptions,
          callback: (
            error: grpc.ServiceError | null,
            response?: unknown,
          ) => void,
        ) => {
          callback(serviceError, undefined);
        },
      )
      .mockImplementationOnce(
        (
          request: unknown,
          metadata: grpc.Metadata,
          options: grpc.CallOptions,
          callback: (
            error: grpc.ServiceError | null,
            response?: unknown,
          ) => void,
        ) => {
          callback(null, {
            ok: {
              payload: Buffer.from(JSON.stringify({ retry: true }), 'utf-8'),
            },
          });
        },
      );

    const result = await bus.invoke({
      type: 'Lookup.Create',
      payload: {},
      meta: { commandId: 'cmd-1' },
    });

    expect(invokeImpl).toHaveBeenCalledTimes(2);
    expect(isOk(result)).toBe(true);
  });
});
