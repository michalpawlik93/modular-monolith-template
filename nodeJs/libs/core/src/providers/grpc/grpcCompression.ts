import * as grpc from '@grpc/grpc-js';

export type GrpcCompressionAlgorithm = 'gzip' | 'none';

export function mapGrpcCompression(
  algorithm?: GrpcCompressionAlgorithm,
): number | undefined {
  if (algorithm === 'gzip') {
    return grpc.compressionAlgorithms.gzip;
  }
  return undefined;
}

