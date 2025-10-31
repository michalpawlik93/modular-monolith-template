import { Container } from 'inversify';
import type { ILogger } from '@app/core';
import { LookupLogger, LOOKUP_LOGGER } from './lookupLogger';

export const registerLookupLogging = (container: Container) => {
  if (!container.isBound(LookupLogger)) {
    container.bind(LookupLogger).toSelf().inSingletonScope();
  }

  if (!container.isBound(LOOKUP_LOGGER)) {
    container
      .bind<ILogger>(LOOKUP_LOGGER)
      .toDynamicValue((ctx) => (ctx as unknown as { container: Container }).container.get(LookupLogger));
  }
};
