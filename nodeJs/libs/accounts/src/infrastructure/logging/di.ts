import { Container } from 'inversify';
import type { ILogger } from '@app/core';
import { AccountLogger, ACCOUNT_LOGGER } from './accountLogger';

export const registerAccountLogging = (container: Container) => {
  if (!container.isBound(AccountLogger)) {
    container.bind(AccountLogger).toSelf().inSingletonScope();
  }

  if (!container.isBound(ACCOUNT_LOGGER)) {
    container
      .bind<ILogger>(ACCOUNT_LOGGER)
      .toDynamicValue((ctx) => (ctx as unknown as { container: Container }).container.get(AccountLogger));
  }
};
