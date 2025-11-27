import { PrismaModuleConfig, buildPrismaClientOptions } from '@app/core/prisma';
import { PrismaClient } from './generated/prisma';

let prisma: PrismaClient | null = null;
let defaultConfig: PrismaModuleConfig | undefined;

export const initAccountsPrisma = (config?: PrismaModuleConfig): PrismaClient => {
  defaultConfig = config ?? defaultConfig;
  if (!prisma) {
    prisma = new PrismaClient(buildPrismaClientOptions(defaultConfig));
  }
  return prisma;
};

export const getAccountsPrisma = (): PrismaClient => {
  return prisma ?? initAccountsPrisma(defaultConfig);
};
