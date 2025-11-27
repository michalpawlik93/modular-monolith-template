import { PrismaClient } from './generated/prisma';
import type { PrismaModuleConfig } from './config';
import { buildPrismaClientOptions } from './config';

let prisma: PrismaClient | null = null;
let defaultConfig: PrismaModuleConfig | undefined;

export const initCorePrisma = (config?: PrismaModuleConfig): PrismaClient => {
  defaultConfig = config ?? defaultConfig;
  if (!prisma) {
    prisma = new PrismaClient(buildPrismaClientOptions(defaultConfig));
  }
  return prisma;
};

export const getCorePrisma = (): PrismaClient => {
  return prisma ?? initCorePrisma(defaultConfig);
};
