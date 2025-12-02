import { PrismaModuleConfig, buildPrismaModuleConfig } from '@app/core/prisma';

export const buildAccountsPrismaConfig = (): PrismaModuleConfig =>
  buildPrismaModuleConfig('accounts', 'DATABASE_URL_ACCOUNTS');

