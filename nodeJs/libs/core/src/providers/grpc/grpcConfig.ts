import type { GrpcCompressionAlgorithm } from './grpcCompression';

export interface GrpcClientConfig {
  keepaliveTimeMs?: number;
  keepaliveTimeoutMs?: number;
  maxReceiveMessageLength?: number;
  maxSendMessageLength?: number;
  compression?: GrpcCompressionAlgorithm;
  maxRetries?: number;
}

export interface GrpcRoutingConfig {
  modules: Record<string, string>;
  defaultTimeoutMs?: number;
  client?: GrpcClientConfig;
}

export interface GrpcServerConfig {
  maxReceiveMessageLength?: number;
  maxSendMessageLength?: number;
  compression?: GrpcCompressionAlgorithm;
}

export const DEFAULT_GRPC_MESSAGE_LENGTH = 32 * 1024 * 1024;
export const DEFAULT_GRPC_CLIENT_KEEPALIVE_TIME_MS = 30_000;
export const DEFAULT_GRPC_CLIENT_KEEPALIVE_TIMEOUT_MS = 10_000;
export const DEFAULT_GRPC_CLIENT_MAX_RETRIES = 3;
export const DEFAULT_GRPC_COMPRESSION: GrpcCompressionAlgorithm = 'gzip';

export const resolveNumberWithDefault = (
  value: string | null | undefined,
  fallback: number,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

export const resolveCompression = (
  value?: string | null,
  fallback: GrpcCompressionAlgorithm = DEFAULT_GRPC_COMPRESSION,
): GrpcCompressionAlgorithm => {
  if (!value) {
    return fallback;
  }
  const normalized = value.toLowerCase();
  if (normalized === 'none') {
    return 'none';
  }
  if (normalized === 'gzip') {
    return 'gzip';
  }
  return fallback;
};

export const resolveRetries = (
  value?: string | null,
  fallback = DEFAULT_GRPC_CLIENT_MAX_RETRIES,
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};
