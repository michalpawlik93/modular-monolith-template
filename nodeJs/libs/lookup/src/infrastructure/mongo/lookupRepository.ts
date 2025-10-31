import { Db } from 'mongodb';
import {
  IBaseRepository,
  useBaseRepository,
} from '@app/core';
import { Lookup } from '../../domain/models/lookup';

export interface LookupDao {
  _id: string;
  value: string;
  type: string;
  shortName?: string;
}

export type ILookupRepository = Pick<
  IBaseRepository<Lookup, LookupDao>,
  'createMany' | 'getPaged' | 'create' | 'update'
>;

export const LOOKUP_REPOSITORY_KEY = Symbol.for('ILookupRepository');

export const createLookupRepository = (db: Db): ILookupRepository => {
  const repo = useBaseRepository<Lookup, LookupDao>(
    db,
    'lookups',
    toDao,
    toDomain
  );
  return {
    ...repo,
  };
};

const toDao = (domainEntity: Lookup): LookupDao => ({
  _id: domainEntity.id,
  value: domainEntity.value,
  type: domainEntity.type,
  shortName: domainEntity.shortName,
});

const toDomain = (daoEntity: LookupDao): Lookup => ({
  id: daoEntity._id,
  value: daoEntity.value,
  type: daoEntity.type,
  shortName: daoEntity.shortName,
});
