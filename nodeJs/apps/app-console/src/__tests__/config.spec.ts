import path from 'node:path';

type EnvOverrides = Partial<NodeJS.ProcessEnv>;

const withConfigModule = (
  env: EnvOverrides,
  run: (mod: typeof import('../config')) => void,
) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env };
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const moduleExports = require('../config') as typeof import('../config');
  try {
    run(moduleExports);
  } finally {
    process.env = originalEnv;
    jest.resetModules();
  }
};

describe('app-console config', () => {
  it('fall backs to debug log level in development when value is invalid', () => {
    withConfigModule({ NODE_ENV: 'development' }, ({ resolveLogLevel }) => {
      expect(resolveLogLevel('verbose')).toBe('debug');
    });
  });

  it('returns info log level as default for production when value missing', () => {
    withConfigModule({ NODE_ENV: 'production' }, ({ resolveLogLevel }) => {
      expect(resolveLogLevel(undefined)).toBe('info');
    });
  });

  it('builds logger config using provided env overrides', () => {
    withConfigModule(
      {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn',
        LOG_FILE_PATH: 'logs/custom.log',
      },
      ({ buildLoggerConfig }) => {
        const config = buildLoggerConfig();

        expect(config.level).toBe('warn');
        expect(config.filePath).toBe(path.join(process.cwd(), 'logs/custom.log'));
        expect(config.prettyInDev).toBe(false);
      },
    );
  });

  it('builds gRPC routing config with numeric timeout when env provided', () => {
    withConfigModule(
      {
        GRPC_CORE_ENDPOINT: 'localhost:5000',
        GRPC_DEFAULT_TIMEOUT_MS: '1500',
        GRPC_CLIENT_KEEPALIVE_TIME_MS: '40000',
        GRPC_CLIENT_KEEPALIVE_TIMEOUT_MS: '5000',
        GRPC_CLIENT_MAX_RECEIVE_MESSAGE_LENGTH: '1048576',
        GRPC_CLIENT_MAX_SEND_MESSAGE_LENGTH: '2097152',
        GRPC_CLIENT_COMPRESSION: 'none',
        GRPC_CLIENT_MAX_RETRIES: '5',
      },
      ({ buildGrpcRoutingConfig }) => {
        const config = buildGrpcRoutingConfig();

        expect(config.modules.Core).toBe('localhost:5000');
        expect(config.defaultTimeoutMs).toBe(1500);
        expect(config.client).toEqual({
          keepaliveTimeMs: 40_000,
          keepaliveTimeoutMs: 5_000,
          maxReceiveMessageLength: 1_048_576,
          maxSendMessageLength: 2_097_152,
          compression: 'none',
          maxRetries: 5,
        });
      },
    );
  });
});
