import { Container } from 'inversify';
import { Db } from 'mongodb';
import { bindOrRebind, MongoSagaRepository, MONGO_TOKENS } from '@app/core';
import { AccountProductSaga, AccountProductSagaData } from './accountProductSaga';

export const ACCOUNT_SAGA_REPOSITORY = Symbol.for('AccountSagaRepository');

export const registerAccountSagas = (container: Container): void => {
  bindOrRebind(container, ACCOUNT_SAGA_REPOSITORY, () => {
    container
      .bind<MongoSagaRepository<AccountProductSagaData>>(ACCOUNT_SAGA_REPOSITORY)
      .toDynamicValue(() => {
        const db = container.get<Db>(MONGO_TOKENS.MONGODB_KEY);
        return new MongoSagaRepository<AccountProductSagaData>(db);
      })
      .inSingletonScope();
  });

  if (container.isBound(AccountProductSaga)) {
    container.unbind(AccountProductSaga);
  }

  container
    .bind(AccountProductSaga)
    .toDynamicValue(() => {
      const repo = container.get<MongoSagaRepository<AccountProductSagaData>>(
        ACCOUNT_SAGA_REPOSITORY,
      );
      return new AccountProductSaga(repo);
    })
    .inSingletonScope();
};
