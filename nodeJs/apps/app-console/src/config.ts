import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import {
  type LoggerConfig,
  type LogLevel,
  type MongoConfig,
  type GrpcRoutingConfig,
  resolveNumberWithDefault,
  resolveCompression,
  resolveRetries,
  DEFAULT_GRPC_MESSAGE_LENGTH,
  DEFAULT_GRPC_CLIENT_KEEPALIVE_TIME_MS,
  DEFAULT_GRPC_CLIENT_KEEPALIVE_TIMEOUT_MS,
} from '@app/core';

const environment = (process.env.NODE_ENV ?? 'development').toLowerCase();
const envDirectory = path.resolve(process.cwd(), 'apps', 'app-console', 'config');
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
  if (!value) {
    return path.join(process.cwd(), 'logs', 'app-console.log');
  }

  if (path.isAbsolute(value)) {
    return value;
  }

  return path.join(process.cwd(), value);
};

export const buildLoggerConfig = (): LoggerConfig => ({
  level: resolveLogLevel(process.env.LOG_LEVEL),
  filePath: resolveLogFilePath(process.env.LOG_FILE_PATH),
  prettyInDev: environment !== 'production',
});

export const buildMongoConfig = (): MongoConfig => ({
  uri: process.env.MONGO_URI,
});

export const getEnvironment = (): string => environment;

const resolveTimeout = (value?: string | null): number | undefined => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return undefined;
};


export const buildGrpcRoutingConfig = (): GrpcRoutingConfig => ({
  modules: {
    Core: process.env.GRPC_CORE_ENDPOINT,
  },
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
