import 'reflect-metadata';
import { Container } from 'inversify';
import { GrpcCommandBusServer, type InvokeReq, type InvokeRes } from '../grpcCommandBusServer';
import { loadBusProto } from '../protoLoader';
import * as grpc from '@grpc/grpc-js';
import { Handler, TYPES } from '../../../features/serviceBus/serviceBus';
import { ok, err } from '../../../utils/result';

jest.mock('../protoLoader', () => ({
  loadBusProto: jest.fn(),
}));

jest.mock('@grpc/grpc-js', () => {
  const serverMock = jest.fn();
  const createInsecure = jest.fn(() => 'insecure-credentials');
  return {
    Server: serverMock,
    ServerCredentials: {
      createInsecure,
    },
  };
});

const loadBusProtoMock =
  loadBusProto as jest.MockedFunction<typeof loadBusProto>;

describe('GrpcCommandBusServer', () => {
  let container: Container;
  let serverAddServiceMock: jest.Mock;
  let serverBindAsyncMock: jest.Mock;
  let serverStartMock: jest.Mock;
  let serverTryShutdownMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    container = new Container();

    serverAddServiceMock = jest.fn();
    serverBindAsyncMock = jest.fn();
    serverStartMock = jest.fn();
    serverTryShutdownMock = jest.fn((cb: () => void) => cb());

    (grpc.Server as unknown as jest.Mock).mockImplementation(() => ({
      addService: serverAddServiceMock,
      bindAsync: serverBindAsyncMock,
      start: serverStartMock,
      tryShutdown: serverTryShutdownMock,
    }));

    loadBusProtoMock.mockReturnValue({
      bus: {
        v1: {
          CommandBus: {
            service: { Invoke: {} },
          },
        },
      },
    } as unknown as ReturnType<typeof loadBusProto>);
  });

  const startServer = async (server: GrpcCommandBusServer, address = '0.0.0.0:5000') => {
    serverBindAsyncMock.mockImplementation(
      (
        addr: string,
        _credentials: unknown,
        cb: (error: Error | null) => void,
      ) => {
        expect(addr).toBe(address);
        cb(null);
      },
    );

    await server.start(address);
  };

  const createMockCall = (request: InvokeReq): grpc.ServerUnaryCall<InvokeReq, InvokeRes> => {
    const mockMetadata = {
      get: jest.fn(),
      set: jest.fn(),
      clone: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn(),
      getMap: jest.fn().mockReturnValue({}),
      toJSON: jest.fn().mockReturnValue({}),
    };
    
    const mockCall = {
      request,
      cancelled: false,
      metadata: mockMetadata,
      getPeer: jest.fn().mockReturnValue('peer'),
      sendMetadata: jest.fn(),
      getDeadline: jest.fn().mockReturnValue(new Date()),
      getPath: jest.fn().mockReturnValue('/path'),
      getHost: jest.fn().mockReturnValue('host'),
      getAuthContext: jest.fn().mockReturnValue({} as unknown),
      getMetricsRecorder: jest.fn().mockReturnValue(undefined),
      addListener: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn().mockReturnValue(10),
      listeners: jest.fn().mockReturnValue([]),
      rawListeners: jest.fn().mockReturnValue([]),
      emit: jest.fn(),
      listenerCount: jest.fn().mockReturnValue(0),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      eventNames: jest.fn().mockReturnValue([]),
    };
    return mockCall as unknown as grpc.ServerUnaryCall<InvokeReq, InvokeRes>;
  };

  const getInvoke = (): ((
    call: grpc.ServerUnaryCall<InvokeReq, InvokeRes>,
    callback: grpc.sendUnaryData<InvokeRes>
  ) => Promise<void>) => {
    expect(serverAddServiceMock).toHaveBeenCalledTimes(1);
    const [, implementation] = serverAddServiceMock.mock.calls[0] as [
      unknown,
      {
        Invoke: (
          call: grpc.ServerUnaryCall<InvokeReq, InvokeRes>,
          callback: grpc.sendUnaryData<InvokeRes>
        ) => Promise<void>;
      },
    ];
    return implementation.Invoke;
  };

  test('registers gRPC service and forwards requests to handlers', async () => {
    const server = new GrpcCommandBusServer(container);
    await startServer(server);

    const handler: Handler = {
      handle: jest.fn().mockResolvedValue(ok({ success: true })),
    };
    container
      .bind<Handler>(TYPES.Handler)
      .toConstantValue(handler)
      .whenNamed('Lookup.Create');

    const invoke = getInvoke();
    const callback = jest.fn();

    await invoke(
      createMockCall({
        type: 'Lookup.Create',
        payload_json: '{"id":"cmd-1"}',
        meta: { correlationId: 'corr-1' },
      }),
      callback,
    );

    expect(handler.handle).toHaveBeenCalledWith({
      type: 'Lookup.Create',
      payload: { id: 'cmd-1' },
      meta: { correlationId: 'corr-1' },
    });
    expect(callback).toHaveBeenCalledWith(null, {
      ok: { payload_json: JSON.stringify({ success: true }) },
    });
  });

  test('returns no handler error when command handler is not registered', async () => {
    const server = new GrpcCommandBusServer(container);
    await startServer(server);

    const invoke = getInvoke();
    const callback = jest.fn();

    await invoke(
      createMockCall({
        type: 'Lookup.Unknown',
        payload_json: '{}',
        meta: {},
      }),
      callback,
    );

    expect(callback).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        err: {
          _type: 'NoHandlerError',
          message: expect.stringContaining('Lookup.Unknown'),
        },
      }),
    );
  });

  test('propagates domain error returned by handler', async () => {
    const server = new GrpcCommandBusServer(container);
    await startServer(server);

    const handler: Handler = {
      handle: jest
        .fn()
        .mockResolvedValue(err({ _type: 'ValidationError', message: 'Broken' })),
    };
    container
      .bind<Handler>(TYPES.Handler)
      .toConstantValue(handler)
      .whenNamed('Lookup.Fail');

    const invoke = getInvoke();
    const callback = jest.fn();

    await invoke(
      createMockCall({
        type: 'Lookup.Fail',
        payload_json: '{}',
        meta: {},
      }),
      callback,
    );

    expect(callback).toHaveBeenCalledWith(null, {
      err: { _type: 'ValidationError', message: 'Broken' },
    });
  });

  test('returns basic error when handler throws an exception', async () => {
    const server = new GrpcCommandBusServer(container);
    await startServer(server);

    const handler: Handler = {
      handle: jest.fn().mockRejectedValue(new Error('boom')),
    };
    container
      .bind<Handler>(TYPES.Handler)
      .toConstantValue(handler)
      .whenNamed('Lookup.Throw');

    const invoke = getInvoke();
    const callback = jest.fn();

    await invoke(
      createMockCall({
        type: 'Lookup.Throw',
        payload_json: '{}',
        meta: {},
      }),
      callback,
    );

    expect(callback).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        err: {
          _type: 'SystemError',
          message: expect.stringContaining('Unhandled server error'),
        },
      }),
    );
  });

  test('stops server via tryShutdown', async () => {
    const server = new GrpcCommandBusServer(container);
    await startServer(server);

    await server.stop();

    expect(serverTryShutdownMock).toHaveBeenCalledTimes(1);
  });
});
