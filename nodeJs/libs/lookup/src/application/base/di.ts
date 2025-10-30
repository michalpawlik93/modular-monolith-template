import { Container } from 'inversify';
import { Handler, TYPES } from '@app/core';
import {
  GET_PAGED_LOOKUPS_COMMAND,
  GetPagedLookupsCommand,
  GetPagedLookupsCommandHandler,
} from './getPagedLookupsCommandHandler';
import { CREATE_LOOKUP_COMMAND_TYPE, CreateLookupCommand, CreateLookupCommandHandler } from './createLookupCommandHandler';

export const registerLookupsCommandHandlers = (container: Container) => {
  container
    .bind<Handler<GetPagedLookupsCommand>>(TYPES.Handler)
    .to(GetPagedLookupsCommandHandler)
    .inSingletonScope()
    .whenNamed(GET_PAGED_LOOKUPS_COMMAND);

  container
    .bind<Handler<CreateLookupCommand>>(TYPES.Handler)
    .to(CreateLookupCommandHandler)
    .inSingletonScope()
    .whenNamed(CREATE_LOOKUP_COMMAND_TYPE);
};
