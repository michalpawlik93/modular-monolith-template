import {
  BaseCommand,
  BasicError,
  Handler,
  Pager,
  PagerResult,
  Result,
} from '@app/core';
import {
  ILookupRepository,
  LOOKUP_REPOSITORY_KEY,
} from '../../infrastructure/mongo/lookupRepository';
import { Lookup } from '../../domain/models/lookup';
import { inject, injectable } from 'inversify';

export class GetPagedLookupsCommand implements BaseCommand {
  constructor(
    public userId: string,
    public caller: string,
    public pager: Pager
  ) {}
}

@injectable()
export class GetPagedLookupsCommandHandler
  implements
    Handler<GetPagedLookupsCommand, Result<PagerResult<Lookup>, BasicError>>
{
  constructor(
    @inject(LOOKUP_REPOSITORY_KEY)
    private lookupRepository: ILookupRepository
  ) {}

  async handle(
    command: GetPagedLookupsCommand
  ): Promise<Result<PagerResult<Lookup>, BasicError>> {
    return await this.lookupRepository.getPaged(command.pager);
  }
}
