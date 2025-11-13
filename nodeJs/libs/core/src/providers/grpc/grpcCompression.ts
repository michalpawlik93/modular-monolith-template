import * as grpc from '@grpc/grpc-js';

export type GrpcCompressionAlgorithm = 'gzip' | 'none';

/**
 * Maps compression algorithm string to gRPC compression algorithm constant.
 */
export function mapGrpcCompression(
  algorithm?: GrpcCompressionAlgorithm,
): number | undefined {
  if (algorithm === 'gzip') {
    return grpc.compressionAlgorithms.gzip;
  }
  return undefined;
}

