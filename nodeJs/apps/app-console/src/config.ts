import {
  type LoggerConfig,
  type GrpcRoutingConfig,
  type MongoConfig,
  resolveNumberWithDefault,
  resolveCompression,
  resolveRetries,
  DEFAULT_GRPC_MESSAGE_LENGTH,
  DEFAULT_GRPC_CLIENT_KEEPALIVE_TIME_MS,
  DEFAULT_GRPC_CLIENT_KEEPALIVE_TIMEOUT_MS,
  loadEnvironment,
  resolveLogLevel as resolveLogLevelValue,
  resolveLogFilePath,
  resolvePositiveInt,
} from '@app/core';

const environment = loadEnvironment('app-console');

export const resolveLogLevel = (value?: string | null) => resolveLogLevelValue(environment, value);

const LOGS_DIRECTORY = 'logs/app-console';

const buildModuleLoggerConfig = (
  moduleName: string,
  filePath?: string | null,
): LoggerConfig => ({
  level: resolveLogLevelValue(environment, process.env.LOG_LEVEL),
  filePath: resolveLogFilePath(moduleName, filePath, {
    allowAbsolute: true,
    logsDirectory: LOGS_DIRECTORY,
  }),
  prettyInDev: environment !== 'production',
});

export const buildAccountsLoggerConfig = (): LoggerConfig =>
  buildModuleLoggerConfig('accounts', process.env.ACCOUNTS_LOG_FILE_PATH);

export const buildProductsLoggerConfig = (): LoggerConfig =>
  buildModuleLoggerConfig('products', process.env.PRODUCTS_LOG_FILE_PATH);

export const buildCoreLoggerConfig = (): LoggerConfig =>
  buildModuleLoggerConfig('core', process.env.CORE_LOG_FILE_PATH ?? process.env.LOG_FILE_PATH);

export const getEnvironment = (): string => environment;

const buildMongoConfig = (uri: string | undefined, fallback: string): MongoConfig => ({
  uri: uri?.trim() || fallback,
});

export const buildAccountsMongoConfig = (): MongoConfig =>
  buildMongoConfig(process.env.ACCOUNTS_MONGO_URI, 'mongodb://localhost:27017/accounts');

export const buildProductsMongoConfig = (): MongoConfig =>
  buildMongoConfig(process.env.PRODUCTS_MONGO_URI, 'mongodb://localhost:27017/products');

export const buildCoreMongoConfig = (): MongoConfig =>
  buildMongoConfig(process.env.CORE_MONGO_URI, 'mongodb://localhost:27017/core');

export const buildGrpcRoutingConfig = (): GrpcRoutingConfig => ({
  modules: {
    Core: process.env.GRPC_CORE_ENDPOINT,
  },
  defaultTimeoutMs: resolvePositiveInt(process.env.GRPC_DEFAULT_TIMEOUT_MS),
  client: {
    keepaliveTimeMs: resolveNumberWithDefault(
      process.env.GRPC_CLIENT_KEEPALIVE_TIME_MS,
      DEFAULT_GRPC_CLIENT_KEEPALIVE_TIME_MS,
    ),
    keepaliveTimeoutMs: resolveNumberWithDefault(
      process.env.GRPC_CLIENT_KEEPALIVE_TIMEOUT_MS,
      DEFAULT_GRPC_CLIENT_KEEPALIVE_TIMEOUT_MS,
    ),
    maxReceiveMessageLength: resolveNumberWithDefault(
      process.env.GRPC_CLIENT_MAX_RECEIVE_MESSAGE_LENGTH,
      DEFAULT_GRPC_MESSAGE_LENGTH,
    ),
    maxSendMessageLength: resolveNumberWithDefault(
      process.env.GRPC_CLIENT_MAX_SEND_MESSAGE_LENGTH,
      DEFAULT_GRPC_MESSAGE_LENGTH,
    ),
    compression: resolveCompression(process.env.GRPC_CLIENT_COMPRESSION),
    maxRetries: resolveRetries(process.env.GRPC_CLIENT_MAX_RETRIES),
  },
});
