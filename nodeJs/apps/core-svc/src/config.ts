import { existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import type { LoggerConfig, LogLevel, MongoConfig } from '@app/core';

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
  if (!value) {
    return path.join(process.cwd(), 'logs', 'core-svc.log');
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
  uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/core',
});

export const getEnvironment = (): string => environment;

export const getGrpcServerAddress = (): string =>
  process.env.GRPC_SERVER_ADDRESS ?? '0.0.0.0:50051';
