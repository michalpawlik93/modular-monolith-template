import { BaseCommand } from '../../features/serviceBus/serviceBus';

/**
 * Parses gRPC payload buffer to object.
 * 
 * Note: Parsing to JSON is necessary because:
 * - gRPC transmits data as Buffer/Uint8Array
 * - Envelope<T> requires payload: T where T extends BaseCommand (Record<string, unknown>)
 * - Handlers expect object payload, not raw buffer
 * 
 * This conversion cannot be avoided without changing the entire serviceBus architecture.
 */
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

