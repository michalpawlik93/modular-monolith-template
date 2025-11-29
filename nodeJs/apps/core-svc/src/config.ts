import {
  type LoggerConfig,
  type GrpcServerConfig,
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

const environment = loadEnvironment('core-svc');

export const resolveLogLevel = (value?: string | null) => resolveLogLevelValue(environment, value);

export const buildLoggerConfig = (): LoggerConfig => ({
  level: resolveLogLevelValue(environment, process.env.LOG_LEVEL),
  filePath: resolveLogFilePath('core-svc', process.env.LOG_FILE_PATH),
  prettyInDev: environment !== 'production',
});

export const getEnvironment = (): string => environment;

export const getGrpcServerAddress = (): string => process.env.GRPC_SERVER_ADDRESS ;

export const buildMongoConfig = (): MongoConfig => ({
  uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/core',
});


export const buildGrpcServerConfig = (): GrpcServerConfig => ({
  maxReceiveMessageLength: resolveNumberWithDefault(
    process.env.GRPC_SERVER_MAX_RECEIVE_MESSAGE_LENGTH,
    DEFAULT_GRPC_MESSAGE_LENGTH,
  ),
  maxSendMessageLength: resolveNumberWithDefault(
    process.env.GRPC_SERVER_MAX_SEND_MESSAGE_LENGTH,
    DEFAULT_GRPC_MESSAGE_LENGTH,
  ),
  compression: resolveCompression(process.env.GRPC_SERVER_COMPRESSION),
});

export const buildGrpcRoutingConfig = (): GrpcRoutingConfig => ({
  modules: {},
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
