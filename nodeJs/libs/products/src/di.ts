import { Container } from 'inversify';
import { PrismaModuleConfig } from '@app/core/prisma';
import { registerProductsPrisma, registerProductsRepository } from './infrastructure/prisma';
import { registerProductFacades, registerProductsCommandHandlers } from './application/base';
import { registerProductLogging } from './infrastructure/logging';

export interface ProductsDomainConfig {
  prisma?: PrismaModuleConfig;
}

export const registerProductsDomain = (
  container: Container,
  config: ProductsDomainConfig,
): void => {
  registerProductLogging(container);
  registerProductsPrisma(container, config.prisma);
  registerProductsRepository(container);
  registerProductsCommandHandlers(container);
  registerProductFacades(container);
};
