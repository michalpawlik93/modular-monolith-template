import { Container } from 'inversify';
import {
  bindOrRebind,
  MongoSagaRepository,
  CORE_SAGA_REPOSITORY,
} from '@app/core';
import { AccountProductSaga, AccountProductSagaData } from './accountProductSaga';

export const ACCOUNT_SAGA_REPOSITORY = Symbol.for('AccountSagaRepository');

export const registerAccountProductSagas = (
  container: Container,
  coreContainer: Container,
): void => {
  bindOrRebind(container, ACCOUNT_SAGA_REPOSITORY, () => {
    container
      .bind<MongoSagaRepository<AccountProductSagaData>>(ACCOUNT_SAGA_REPOSITORY)
      .toDynamicValue(() => {
        return coreContainer.get<MongoSagaRepository<AccountProductSagaData>>(
          CORE_SAGA_REPOSITORY,
        );
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
    .inRequestScope();
};
