import { inject, injectable } from 'inversify';
import {
  LOGGING_TYPES,
  ModuleLogger,
  type LoggerFactory,
} from '@app/core';

export const ACCOUNT_LOGGER = Symbol.for('AccountLogger');

@injectable()
export class AccountLogger extends ModuleLogger {
  constructor(
    @inject(LOGGING_TYPES.LoggerFactory)
    loggerFactory: LoggerFactory,
  ) {
    super(loggerFactory, 'ACCOUNT', { component: 'account' });
  }
}
