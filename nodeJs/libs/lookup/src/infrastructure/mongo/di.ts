import { Container } from 'inversify';
import {
  LOOKUP_REPOSITORY_KEY,
  createLookupRepository,
  ILookupRepository,
} from './lookupRepository';
import { Db } from 'mongodb';
import { MONGO_TOKENS } from '@app/core';

export const registerLookupRepository = (container: Container) => {
  const db = container.get<Db>(MONGO_TOKENS.MONGODB_KEY);
  container
    .bind<ILookupRepository>(LOOKUP_REPOSITORY_KEY)
    .toDynamicValue(() => createLookupRepository(db))
    .inSingletonScope();
};
