import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from './generated/prisma';
import { getCorePrisma } from './client';

const als = new AsyncLocalStorage<PrismaClient>();

export const coreDb = (): PrismaClient => {
  return als.getStore() ?? getCorePrisma();
};

export const runInCoreTx = async <T>(fn: () => Promise<T>): Promise<T> => {
  return getCorePrisma().$transaction(async (tx) => {
    return als.run(tx as unknown as PrismaClient, fn);
  });
};
