import { ok, Result, BasicError, PagerResult, registerCommandHandlerMock } from '@app/core';
import { Container } from 'inversify';
import {
  GET_PAGED_LOOKUPS_COMMAND,
  GetPagedLookupsCommand,
} from '../application/base/handlers/getPagedLookupsCommandHandler';
import { Lookup, mockLookup } from '../domain/models/lookup';

export const mockGetPagedLookupsCommandHandler = (
  container: Container,
  result?: Promise<Result<PagerResult<Lookup>, BasicError>>
): Container =>
  registerCommandHandlerMock<GetPagedLookupsCommand, PagerResult<Lookup>>(
    container,
    GET_PAGED_LOOKUPS_COMMAND,
    {
      defaultResult: () =>
        ok({
          data: [mockLookup()],
          cursor: 'mock-cursor',
        }),
      result,
    }
  );
