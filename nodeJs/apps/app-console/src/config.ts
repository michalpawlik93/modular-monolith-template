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

export const buildLoggerConfig = (): LoggerConfig => ({
  level: resolveLogLevelValue(environment, process.env.LOG_LEVEL),
  filePath: resolveLogFilePath('app-console', process.env.LOG_FILE_PATH, { allowAbsolute: true }),
  prettyInDev: environment !== 'production',
});

export const getEnvironment = (): string => environment;

export const buildMongoConfig = (): MongoConfig => ({
  uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/app',
});

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
