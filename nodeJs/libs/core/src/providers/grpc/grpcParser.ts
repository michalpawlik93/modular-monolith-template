import { BaseCommand } from '../../features/serviceBus/serviceBus';

export function parseGrpcPayload<T = Record<string, unknown>>(
  payload: Buffer | Uint8Array | null | undefined,
): T | null {
  if (!payload || payload.length === 0) {
    return null as T;
  }
  try {
    const buffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload);
    const parsed = JSON.parse(buffer.toString('utf-8'));
    
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as T;
    }
    return null as T;
  } catch {
    return null as T;
  }
}

/**
 * Encodes command payload to gRPC buffer format.
 */
export function encodeGrpcPayload(
  payload: BaseCommand | undefined,
): Buffer {
  if (!payload) {
    return Buffer.alloc(0);
  }
  return Buffer.from(JSON.stringify(payload), 'utf-8');
}

