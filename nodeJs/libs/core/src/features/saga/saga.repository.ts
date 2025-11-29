import { inject, injectable, optional } from 'inversify';
import { Collection, Db, ObjectId, ModifyResult, WithId } from 'mongodb';
import {
  BasicError,
  Result,
  ok,
  basicErr,
  notFoundErr,
  isOk,
  isErr,
} from '../../utils/result';
import { MONGO_TOKENS } from '../../providers/mongo';
import { SagaState, SagaStatus, SAGA_COLLECTION_NAME } from './saga.types';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const normalizeId = (value: unknown): string =>
  typeof value === 'string' ? value : new ObjectId(value as any).toHexString();

@injectable()
export class MongoSagaRepository<Data = unknown> {
  private readonly collection: Collection<SagaState<Data>>;

  constructor(
    @inject(MONGO_TOKENS.MONGODB_KEY) db: Db,
    @optional() collectionName?: string,
  ) {
    this.collection = db.collection<SagaState<Data>>(
      collectionName ?? SAGA_COLLECTION_NAME,
    );
  }

  async ensureIndexes(): Promise<Result<null, BasicError>> {
    try {
      await this.collection.createIndex(
        { type: 1, sagaId: 1 },
        { unique: true },
      );
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
      const doc = await this.collection.findOne({ type, sagaId });
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
    expiresAt?: Date;
  }): Promise<Result<SagaState<Data>, BasicError>> {
    const now = new Date();
    const document: SagaState<Data> = {
      _id: new ObjectId().toHexString(),
      type: initial.type,
      sagaId: initial.sagaId,
      status: initial.status,
      data: initial.data,
      version: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: initial.expiresAt,
    };

    try {
      await this.collection.insertOne(document);
      return ok(document);
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
      const now = new Date();
      const result = await this.collection.findOneAndUpdate(
        { _id: state._id, version: state.version },
        {
          $set: {
            status: state.status,
            data: state.data,
            updatedAt: now,
            expiresAt: state.expiresAt,
          },
          $inc: { version: 1 },
        },
        { returnDocument: 'after' },
      );

      const updated = (result as unknown as ModifyResult<SagaState<Data>>).value;
      if (!updated) {
        return notFoundErr(
          `Optimistic lock error for saga ${state._id} (type=${state.type})`,
        );
      }

      return ok(this.mapToState(updated));
    } catch (error) {
      return basicErr(
        `Failed to update saga ${state._id}: ${getErrorMessage(error)}`,
      );
    }
  }

  private mapToState(doc: SagaState<Data> | WithId<SagaState<Data>>): SagaState<Data> {
    return {
      ...doc,
      _id: normalizeId(doc._id),
    };
  }
}
