import { injectable } from 'inversify';
import { Collection } from 'mongodb';
import {
  BasicError,
  Result,
  ok,
  basicErr,
  notFoundErr,
  isOk,
  isErr,
} from '../../utils/result';
import { SagaState, SagaStatus, SAGA_COLLECTION_NAME } from './saga.types';
import { MongoConnection } from '../../providers/mongo';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

type SagaDocument<Data = unknown> = Omit<SagaState<Data>, 'data'>;

@injectable()
export class MongoSagaRepository<Data = unknown> {
  private readonly collection: Collection<SagaDocument<Data>>;

  constructor(
    connection: MongoConnection,
    collectionName?: string,
  ) {
    this.collection = connection.client.db().collection<SagaDocument<Data>>(
      collectionName ?? SAGA_COLLECTION_NAME,
    );
  }

  async ensureIndexes(): Promise<Result<null, BasicError>> {
    try {
      await this.collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 },
      );
      return ok(null);
    } catch (error) {
      return basicErr(
        `Failed to ensure saga indexes: ${getErrorMessage(error)}`,
      );
    }
  }

  async findBySagaId(
    type: string,
    sagaId: string,
  ): Promise<Result<SagaState<Data> | null, BasicError>> {
    try {
      const doc = await this.collection.findOne({ _id: sagaId, type });
      if (!doc) {
        return ok(null);
      }
      return ok(this.mapToState(doc));
    } catch (error) {
      return basicErr(
        `Failed to load saga ${sagaId} for type ${type}: ${getErrorMessage(error)}`,
      );
    }
  }

  async create(initial: {
    type: string;
    sagaId: string;
    status: SagaStatus;
    data: Data;
    currentStep?: string;
    ttl: number;
    expiresAt?: Date;
  }): Promise<Result<SagaState<Data>, BasicError>> {
    const now = new Date();
    const expiresAt =
      initial.expiresAt ?? new Date(now.getTime() + initial.ttl * 1000);
    const document: SagaDocument<Data> = {
      _id: initial.sagaId,
      type: initial.type,
      status: initial.status,
      currentStep: initial.currentStep,
      ttl: initial.ttl,
      version: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      tempData: null,
    };

    try {
      await this.collection.insertOne(document);
      return ok(this.mapToState(document, initial.data));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('duplicate key')) {
        const existing = await this.findBySagaId(initial.type, initial.sagaId);
        if (isErr(existing)) {
          return existing;
        }
        if (isOk(existing) && existing.value) {
          return ok(existing.value);
        }
      }
      return basicErr(`Failed to create saga: ${errorMessage}`);
    }
  }

  async save(state: SagaState<Data>): Promise<Result<SagaState<Data>, BasicError>> {
    try {
      console.log(`Saving saga ${state._id} (type=${state.type},version =${state.version}, data=${JSON.stringify(state.data)})`);
      const now = new Date();
      const expiresAt =
        state.expiresAt ?? new Date(now.getTime() + state.ttl * 1000);
      const result = await this.collection.findOneAndUpdate(
        { _id: state._id, type: state.type, version: state.version },
        {
          $set: {
            status: state.status,
            currentStep: state.currentStep,
            ttl: state.ttl,
            updatedAt: now,
            expiresAt,
          },
          $inc: { version: 1 },
        },
        { returnDocument: 'after' },
      );
      const updated = result as SagaDocument<Data> | null;
      if (!updated) {
        return notFoundErr(
          `Optimistic lock error for saga ${state._id} (type=${state.type})`,
        );
      }

      return ok(this.mapToState(updated, state.data));
    } catch (error) {
      return basicErr(
        `Failed to update saga ${state._id}: ${getErrorMessage(error)}`,
      );
    }
  }

  private mapToState(
    doc: SagaDocument<Data>,
    data?: Data,
  ): SagaState<Data> {
    return {
      ...doc,
      data,
    };
  }
}
