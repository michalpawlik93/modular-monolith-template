import {
  BaseCommand,
  BasicError,
  Envelope,
  Handler,
  Pager,
  PagerResult,
  Result,
  isErr,
} from '@app/core';
import {
  ILookupRepository,
  LOOKUP_REPOSITORY_KEY,
} from '../../infrastructure/mongo/lookupRepository';
import { Lookup } from '../../domain/models/lookup';
import { inject, injectable } from 'inversify';

export interface GetPagedLookupsCommand extends BaseCommand {
  pager: Pager;
}

export const GET_PAGED_LOOKUPS_COMMAND = 'lookup.getPaged';

@injectable()
export class GetPagedLookupsCommandHandler
  implements
    Handler<GetPagedLookupsCommand, PagerResult<Lookup>>
{
  constructor(
    @inject(LOOKUP_REPOSITORY_KEY)
    private lookupRepository: ILookupRepository,
  ) {}

  async handle(
    env: Envelope<GetPagedLookupsCommand>
  ): Promise<Result<PagerResult<Lookup>, BasicError>> {
    const { pager } = env.payload;
    const result = await this.lookupRepository.getPaged(pager);

    if (isErr(result)) {
      return result;
    }

    return result;
  }
}
