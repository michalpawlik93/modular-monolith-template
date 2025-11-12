import { Result, BasicError } from '@app/core';
import {
  CreateLookupCommand,
  CreateLookupResponse,
  ILookupBaseFacade,
} from '@app/lookup';

export const invokeCreateLookupGrpc = async (
  facade: ILookupBaseFacade,
  payload: CreateLookupCommand,
): Promise<Result<CreateLookupResponse, BasicError>> => {
  return facade.invokeCreateLookup(payload, { via: 'grpc' });
};
