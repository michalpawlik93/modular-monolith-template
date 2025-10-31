import { inject, injectable } from 'inversify';
import {
  LOGGING_TYPES,
  ModuleLogger,
  type LoggerFactory,
} from '@app/core';

export const LOOKUP_LOGGER = Symbol.for('LookupLogger');

@injectable()
export class LookupLogger extends ModuleLogger {
  constructor(
    @inject(LOGGING_TYPES.LoggerFactory)
    loggerFactory: LoggerFactory,
  ) {
    super(loggerFactory, 'LOOKUP', { component: 'lookup' });
  }
}
