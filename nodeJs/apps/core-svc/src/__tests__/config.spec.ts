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

describe('core-svc config', () => {
  it('defaults to debug level for invalid value outside production', () => {
    withConfigModule({ NODE_ENV: 'development' }, ({ resolveLogLevel }) => {
      expect(resolveLogLevel('invalid')).toBe('debug');
    });
  });

  it('returns info for invalid value when environment is production', () => {
    withConfigModule({ NODE_ENV: 'production' }, ({ resolveLogLevel }) => {
      expect(resolveLogLevel('invalid')).toBe('info');
    });
  });

  it('builds grpc server logger config using env overrides', () => {
    withConfigModule(
      {
        NODE_ENV: 'production',
        LOG_LEVEL: 'error',
        CORE_SERVER_LOG_FILE_PATH: 'logs/core-svc.log',
      },
      ({ buildGrpcServerLoggerConfig }) => {
        const config = buildGrpcServerLoggerConfig();

        expect(config.level).toBe('error');
        expect(config.filePath).toBe(
          path.join(process.cwd(), 'logs/core-svc.log'),
        );
        expect(config.prettyInDev).toBe(false);
      },
    );
  });

  it('exposes gRPC server address from env', () => {
    withConfigModule(
      {
        GRPC_SERVER_ADDRESS: '0.0.0.0:4000',
      },
      ({ getGrpcServerAddress }) => {
        expect(getGrpcServerAddress()).toBe('0.0.0.0:4000');
      },
    );
  });
});
