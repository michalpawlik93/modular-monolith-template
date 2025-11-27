import { Container } from 'inversify';
import { PrismaClient } from './generated/prisma';
import { PrismaModuleConfig, registerPrismaSingleton } from '@app/core/prisma';
import { bindOrRebind } from '@app/core';
import { initAccountsPrisma } from './client';
import {
  ACCOUNT_REPOSITORY_KEY,
  AccountRepository,
  IAccountRepository,
} from './account.repository';

export const ACCOUNTS_TOKENS = {
  PRISMA_CONFIG: Symbol.for('AccountsPrismaConfig'),
  PRISMA_CLIENT: Symbol.for('AccountsPrismaClient'),
};

export const registerAccountsPrisma = (
  container: Container,
  config?: PrismaModuleConfig,
): PrismaClient => {
  bindOrRebind(container, ACCOUNTS_TOKENS.PRISMA_CONFIG, () => {
    container.bind<PrismaModuleConfig>(ACCOUNTS_TOKENS.PRISMA_CONFIG).toConstantValue(config);
  });

  return registerPrismaSingleton<PrismaClient>(
    container,
    ACCOUNTS_TOKENS.PRISMA_CLIENT,
    () => initAccountsPrisma(config),
  );
};

export const registerAccountRepository = (container: Container): void => {
  bindOrRebind(container, ACCOUNT_REPOSITORY_KEY, () => {
    container.bind<IAccountRepository>(ACCOUNT_REPOSITORY_KEY).to(AccountRepository).inSingletonScope();
  });
};
