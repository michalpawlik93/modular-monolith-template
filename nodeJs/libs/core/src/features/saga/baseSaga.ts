import { injectable } from 'inversify';
import { BasicError, Result, isErr, ok } from '../../utils/result';
import { MongoSagaRepository } from './saga.repository';
import { SagaState, SagaStatus } from './saga.types';

@injectable()
export abstract class BaseSaga<Data = unknown> {
  protected abstract readonly type: string;
  protected readonly defaultTtlDays = 30;

  constructor(protected readonly repo: MongoSagaRepository<Data>) {}

  async loadOrStart(
    sagaId: string,
    initialData: Data,
  ): Promise<Result<SagaState<Data>, BasicError>> {
    const existingResult = await this.repo.findBySagaId(this.type, sagaId);
    if (isErr(existingResult)) {
      return existingResult;
    }

    if (existingResult.value) {
      return ok(existingResult.value);
    }

    return this.repo.create({
      type: this.type,
      sagaId,
      status: SagaStatus.NEW,
      data: initialData,
      expiresAt: this.computeExpiresAt(),
    });
  }

  isFinished(saga: SagaState<Data>): boolean {
    return (
      saga.status === SagaStatus.COMPLETED || saga.status === SagaStatus.FAILED
    );
  }

  protected computeExpiresAt(): Date {
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(now.getDate() + this.defaultTtlDays);
    return expires;
  }

  protected async updateState(
    saga: SagaState<Data>,
    update: {
      status?: SagaStatus;
      data?: Partial<Data>;
      expiresAt?: Date;
    },
  ): Promise<Result<SagaState<Data>, BasicError>> {
    const next: SagaState<Data> = {
      ...saga,
      status: update.status ?? saga.status,
      data: update.data ? { ...saga.data, ...update.data } : saga.data,
      expiresAt: update.expiresAt ?? saga.expiresAt,
    };
    return this.repo.save(next);
  }
}
