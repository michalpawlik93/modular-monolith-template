import { Container } from 'inversify';
import { registerLookupRepository } from './infrastructure/mongo/di';
import { registerLookupsCommandHandlers } from './application/base';

export const registerLookupsDomain = (container: Container) => {
  registerLookupRepository(container);
  registerLookupsCommandHandlers(container);
};
