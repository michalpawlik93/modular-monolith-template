import { PrismaModuleConfig, buildPrismaModuleConfig } from '@app/core/prisma';

/**
 * Builds Prisma module configuration for accounts schema from environment variables
 * @returns PrismaModuleConfig with the database URL
 */
export const buildAccountsPrismaConfig = (): PrismaModuleConfig =>
  buildPrismaModuleConfig('accounts', 'DATABASE_URL_ACCOUNTS');

