import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from './generated/prisma';
import { getAccountsPrisma } from './client';

const als = new AsyncLocalStorage<PrismaClient>();

export const accountsDb = (): PrismaClient => {
  return als.getStore() ?? getAccountsPrisma();
};

export const runInAccountsTx = async <T>(fn: () => Promise<T>): Promise<T> => {
  return getAccountsPrisma().$transaction(async (tx) => {
    return als.run(tx as unknown as PrismaClient, fn);
  });
};
