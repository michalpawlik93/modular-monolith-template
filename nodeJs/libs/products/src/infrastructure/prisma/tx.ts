import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from './generated/prisma';
import { getProductsPrisma } from './client';

const als = new AsyncLocalStorage<PrismaClient>();

export const productsDb = (): PrismaClient => {
  return als.getStore() ?? getProductsPrisma();
};

export const runInProductsTx = async <T>(fn: () => Promise<T>): Promise<T> => {
  return getProductsPrisma().$transaction(async (tx) => {
    return als.run(tx as unknown as PrismaClient, fn);
  });
};
