import { Container } from 'inversify';
import { PrismaModuleConfig } from '@app/core/prisma';
import { registerAccountFacades, registerAccountsCommandHandlers } from './application/base';
import { registerAccountLogging } from './infrastructure/logging';
import { registerAccountsPrisma, registerAccountRepository } from './infrastructure/prisma';
import { registerAccountSagas } from './application/base/sagas/di';

export interface AccountsDomainConfig {
  prisma?: PrismaModuleConfig;
}

export const registerAccountsDomain = (
  container: Container,
  config: AccountsDomainConfig,
): void => {
  registerAccountLogging(container);
  registerAccountsPrisma(container, config.prisma);
  registerAccountRepository(container);
  registerAccountSagas(container);
  registerAccountsCommandHandlers(container);
  registerAccountFacades(container);
};
