import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import {
  type LoggerConfig,
  type LogLevel,
  type GrpcServerConfig,
  type GrpcRoutingConfig,
  resolveNumberWithDefault,
  resolveCompression,
  resolveRetries,
  DEFAULT_GRPC_MESSAGE_LENGTH,
  DEFAULT_GRPC_CLIENT_KEEPALIVE_TIME_MS,
  DEFAULT_GRPC_CLIENT_KEEPALIVE_TIMEOUT_MS,
} from '@app/core';

const environment = (process.env.NODE_ENV ?? 'development').toLowerCase();
const envDirectory = path.resolve(process.cwd(), 'apps', 'core-svc', 'config');
const envFilePath = path.join(envDirectory, `env.${environment}`);

if (existsSync(envFilePath)) {
  loadEnv({ path: envFilePath });
} else {
  loadEnv();
}

const LOG_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];

export const resolveLogLevel = (value?: string | null): LogLevel => {
  if (!value) {
    return environment === 'production' ? 'info' : 'debug';
  }

  const normalized = value.toLowerCase() as LogLevel;
  if (LOG_LEVELS.includes(normalized)) {
    return normalized;
  }

  return environment === 'production' ? 'info' : 'debug';
};

const resolveLogFilePath = (value?: string | null): string => {
  return value ? path.join(process.cwd(), value) : path.join(process.cwd(), 'logs', 'core-svc.log');
};

export const buildLoggerConfig = (): LoggerConfig => ({
  level: resolveLogLevel(process.env.LOG_LEVEL),
  filePath: resolveLogFilePath(process.env.LOG_FILE_PATH),
  prettyInDev: environment !== 'production',
});

export const getEnvironment = (): string => environment;

export const getGrpcServerAddress = (): string => process.env.GRPC_SERVER_ADDRESS ;


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

const resolveTimeout = (value?: string | null): number | undefined => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return undefined;
};


export const buildGrpcRoutingConfig = (): GrpcRoutingConfig => ({
  modules: {},
  defaultTimeoutMs: resolveTimeout(process.env.GRPC_DEFAULT_TIMEOUT_MS),
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
