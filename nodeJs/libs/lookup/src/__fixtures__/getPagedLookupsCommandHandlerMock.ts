import { ok, Result, BasicError, Handler, PagerResult } from '@app/core';
import { Container, injectable } from 'inversify';
import { GetPagedLookupsCommand } from '../application/pagedLookup/getPagedLookupsCommandHandler';
import { Lookup, mockLookup } from '../domain/models/lookup';

@injectable()
class GetPagedLookupsCommandHandlerMock
  implements
    Handler<GetPagedLookupsCommand, Result<PagerResult<Lookup>, BasicError>>
{
  constructor(
    private result?: Promise<Result<PagerResult<Lookup>, BasicError>>
  ) {}

  async handle(
    _command: GetPagedLookupsCommand
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
  const handlerName = GetPagedLookupsCommand.name;

  if (container.isBound(handlerName)) {
    container.unbind(handlerName);
  }

  container
    .bind(handlerName)
    .toConstantValue(new GetPagedLookupsCommandHandlerMock(result));

  return container;
};
