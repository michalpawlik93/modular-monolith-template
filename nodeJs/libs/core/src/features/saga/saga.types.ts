import { z } from 'zod';

export enum SagaStatus {
  NEW = 'NEW',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface SagaState<Data = unknown> {
  _id: string;
  type: string;
  sagaId: string;
  status: SagaStatus;
  data: Data;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export const SagaStateSchema = z.object({
  _id: z.string(),
  type: z.string(),
  sagaId: z.string(),
  status: z.nativeEnum(SagaStatus),
  data: z.unknown(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
});

export const SAGA_COLLECTION_NAME = 'sagas';
