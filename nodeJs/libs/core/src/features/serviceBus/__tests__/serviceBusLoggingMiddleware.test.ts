import 'reflect-metadata';
import { ServiceBusLoggingMiddleware } from '../serviceBusLoggingMiddleware';
import { LoggerFactory } from '../../logging';
import type { ILogger } from '../../logging/ILogger';
import type { Envelope } from '../serviceBus';
import {  BasicError, ok, err, isOk, isErr } from '../../../utils/result';

const mockLogger: ILogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn(),
};

const mockLoggerFactory: Partial<LoggerFactory> = {
  forScope: jest.fn(() => mockLogger),
};

describe('ServiceBusLoggingMiddleware', () => {
  let middleware: ServiceBusLoggingMiddleware;
  let loggerFactory: jest.Mocked<LoggerFactory>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    loggerFactory = mockLoggerFactory as jest.Mocked<LoggerFactory>;
    middleware = new ServiceBusLoggingMiddleware(loggerFactory);
  });

  describe('handle', () => {
    const createEnvelope = (payload: Record<string, unknown> = {}): Envelope => ({
      type: 'test.command',
      payload,
      meta: { correlationId: 'corr-123' },
    });

    test('should log info when processing starts', async () => {
      const envelope = createEnvelope({ id: 'cmd-123' });
      const nextResult = ok({ result: 'success' });
      const next = jest.fn().mockResolvedValue(nextResult);

      const result = await middleware.handle(envelope, next);

      expect(loggerFactory.forScope).toHaveBeenCalledWith('SERVICEBUS', {
        commandType: 'test.command',
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          commandType: 'test.command',
          commandId: 'cmd-123',
          meta: { correlationId: 'corr-123' },
        },
        'Processing command: test.command, id: cmd-123'
      );
      expect(next).toHaveBeenCalled();
      expect(isOk(result)).toBe(true);
    });

    test('should log info when command succeeds', async () => {
      const envelope = createEnvelope({ id: 'cmd-456' });
      const nextResult = ok({ result: 'success' });
      const next = jest.fn().mockResolvedValue(nextResult);

      const result = await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          commandType: 'test.command',
          commandId: 'cmd-456',
        }),
        expect.stringContaining('Processing command')
      );
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        2,
        {
          commandType: 'test.command',
          commandId: 'cmd-456',
        },
        'Command succeeded: test.command, id: cmd-456'
      );
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual({ result: 'success' });
      }
    });

    test('should log error when command fails', async () => {
      const envelope = createEnvelope({ id: 'cmd-789' });
      const error: BasicError = { message: 'Test error', _type: 'TestError' };
      const nextResult = err(error);
      const next = jest.fn().mockResolvedValue(nextResult);

      const result = await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          commandType: 'test.command',
          commandId: 'cmd-789',
        }),
        expect.stringContaining('Processing command')
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          commandType: 'test.command',
          commandId: 'cmd-789',
          error: {
            type: 'TestError',
            message: 'Test error',
          },
        },
        'Command failed: test.command, id: cmd-789'
      );
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toEqual(error);
      }
    });

    test('should extract commandId from payload.id', async () => {
      const envelope = createEnvelope({ id: 'command-id-123' });
      const nextResult = ok(null);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          commandId: 'command-id-123',
        }),
        expect.stringContaining('command-id-123')
      );
    });

    test('should extract commandId from payload.type when payload.id is missing', async () => {
      const envelope = createEnvelope({ type: 'command-type-456' });
      const nextResult = ok(null);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          commandId: 'command-type-456',
        }),
        expect.stringContaining('command-type-456')
      );
    });

    test('should use env.type as fallback when payload.id and payload.type are missing', async () => {
      const envelope = createEnvelope({});
      const nextResult = ok(null);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          commandId: 'test.command',
        }),
        expect.stringContaining('test.command')
      );
    });

    test('should prefer payload.id over payload.type', async () => {
      const envelope = createEnvelope({
        id: 'preferred-id',
        type: 'fallback-type',
      });
      const nextResult = ok(null);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          commandId: 'preferred-id',
        }),
        expect.stringContaining('preferred-id')
      );
    });

    test('should use SERVICEBUS scope when creating logger', async () => {
      const envelope = createEnvelope({ id: 'cmd-123' });
      const nextResult = ok(null);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(loggerFactory.forScope).toHaveBeenCalledWith('SERVICEBUS', {
        commandType: 'test.command',
      });
    });

    test('should include metadata in processing log', async () => {
      const envelope: Envelope = {
        type: 'test.command',
        payload: { id: 'cmd-123' },
        meta: { correlationId: 'corr-456', userId: 'user-789' },
      };
      const nextResult = ok(null);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          commandType: 'test.command',
          commandId: 'cmd-123',
          meta: { correlationId: 'corr-456', userId: 'user-789' },
        },
        expect.any(String)
      );
    });

    test('should return the result from next()', async () => {
      const envelope = createEnvelope({ id: 'cmd-123' });
      const nextResult = ok({ data: 'test data' });
      const next = jest.fn().mockResolvedValue(nextResult);

      const result = await middleware.handle(envelope, next);

      expect(result).toBe(nextResult);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual({ data: 'test data' });
      }
    });

    test('should return error result from next()', async () => {
      const envelope = createEnvelope({ id: 'cmd-123' });
      const error: BasicError = { message: 'Error message', _type: 'ErrorType' };
      const nextResult = err(error);
      const next = jest.fn().mockResolvedValue(nextResult);

      const result = await middleware.handle(envelope, next);

      expect(result).toBe(nextResult);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toEqual(error);
      }
    });

    test('should handle envelope without metadata', async () => {
      const envelope: Envelope = {
        type: 'test.command',
        payload: { id: 'cmd-123' },
      };
      const nextResult = ok(null);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          commandType: 'test.command',
          commandId: 'cmd-123',
          meta: undefined,
        },
        expect.any(String)
      );
    });

    test('should handle different error types correctly', async () => {
      const envelope = createEnvelope({ id: 'cmd-123' });
      const error: BasicError = {
        message: 'Not found',
        _type: 'NotFoundError',
      };
      const nextResult = err(error);
      const next = jest.fn().mockResolvedValue(nextResult);

      await middleware.handle(envelope, next);

      expect(mockLogger.error).toHaveBeenCalledWith(
        {
          commandType: 'test.command',
          commandId: 'cmd-123',
          error: {
            type: 'NotFoundError',
            message: 'Not found',
          },
        },
        'Command failed: test.command, id: cmd-123'
      );
    });

    test('should have correct order property', () => {
      expect(middleware.order).toBe(5);
    });
  });
});

