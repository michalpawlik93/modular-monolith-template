import { Container } from 'inversify';
import { PrismaClient } from './generated/prisma';
import { PrismaModuleConfig, registerPrismaSingleton } from '@app/core/prisma';
import { bindOrRebind } from '@app/core';
import { initProductsPrisma } from './client';
import { IProductsRepository, PRODUCTS_REPOSITORY_KEY, ProductsRepository } from './products.repository';

export const PRODUCTS_TOKENS = {
  PRISMA_CONFIG: Symbol.for('ProductsPrismaConfig'),
  PRISMA_CLIENT: Symbol.for('ProductsPrismaClient'),
};

export const registerProductsPrisma = (
  container: Container,
  config?: PrismaModuleConfig,
): PrismaClient => {
  bindOrRebind(container, PRODUCTS_TOKENS.PRISMA_CONFIG, () => {
    container.bind<PrismaModuleConfig>(PRODUCTS_TOKENS.PRISMA_CONFIG).toConstantValue(config);
  });

  return registerPrismaSingleton<PrismaClient>(
    container,
    PRODUCTS_TOKENS.PRISMA_CLIENT,
    () => initProductsPrisma(config),
  );
};

export const registerProductsRepository = (container: Container): void => {
  bindOrRebind(container, PRODUCTS_REPOSITORY_KEY, () => {
    container.bind<IProductsRepository>(PRODUCTS_REPOSITORY_KEY).to(ProductsRepository).inSingletonScope();
  });
};
