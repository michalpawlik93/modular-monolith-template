import { Container } from 'inversify';
import { registerLookupRepository } from './infrastructure/mongo/di';
import {
  registerLookupFacades,
  registerLookupsCommandHandlers,
} from './application/base';
import { registerLookupLogging } from './infrastructure/logging';

export const registerLookupsDomain = (container: Container) => {
  registerLookupLogging(container);
  registerLookupRepository(container);
  registerLookupsCommandHandlers(container);
  registerLookupFacades(container);
};
