import {
  ok,
  Result,
  BasicError,
  Handler,
  PagerResult,
  Envelope,
  TYPES,
} from '@app/core';
import { Container, injectable } from 'inversify';
import {
  GET_PAGED_LOOKUPS_COMMAND,
  GetPagedLookupsCommand,
} from '../application/base/getPagedLookupsCommandHandler';
import { Lookup, mockLookup } from '../domain/models/lookup';

@injectable()
class GetPagedLookupsCommandHandlerMock
  implements Handler<GetPagedLookupsCommand, PagerResult<Lookup>>
{
  constructor(
    private result?: Promise<Result<PagerResult<Lookup>, BasicError>>
  ) {}

  async handle(
    _env: Envelope<GetPagedLookupsCommand>
  ): Promise<Result<PagerResult<Lookup>, BasicError>> {
    return (
      this.result ??
      Promise.resolve(
        ok({
          data: [mockLookup()],
          cursor: 'mock-cursor',
        })
      )
    );
  }
}

export const mockGetPagedLookupsCommandHandler = (
  container: Container,
  result?: Promise<Result<PagerResult<Lookup>, BasicError>>
): Container => {
  if (container.isBound(TYPES.Handler)) {
    container.unbindSync(TYPES.Handler);
  }

  container
    .bind<Handler<GetPagedLookupsCommand>>(TYPES.Handler)
    .toConstantValue(new GetPagedLookupsCommandHandlerMock(result))
    .whenNamed(GET_PAGED_LOOKUPS_COMMAND);

  return container;
};
