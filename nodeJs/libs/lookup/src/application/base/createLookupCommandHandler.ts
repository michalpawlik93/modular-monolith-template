import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { Handler, Envelope, TYPES, BaseCommand, isErr } from '@app/core';
import { Result, BasicError, ok, basicErr } from '@app/core';
import { ILookupRepository, LOOKUP_REPOSITORY_KEY } from '../../infrastructure/mongo/lookupRepository';
import { Lookup } from '../../domain';

export const CREATE_LOOKUP_COMMAND_TYPE = 'lookup.create';

export interface CreateLookupCommand extends BaseCommand, Lookup {
}

export interface CreateLookupResponse {
	id: string;
}

@injectable()
export class CreateLookupCommandHandler
	implements Handler<CreateLookupCommand, CreateLookupResponse>
{
	constructor(
		@inject(LOOKUP_REPOSITORY_KEY)
		private readonly repo: ILookupRepository
	) {}

	async handle(
		env: Envelope<CreateLookupCommand>
	): Promise<Result<CreateLookupResponse, BasicError>> {
		const { id, value, type, shortName } = env.payload;
		if (!id || !value || !type) {
			return basicErr('Missing required fields');
		}
		const createResult = await this.repo.create({
			id,
			value,
			type,
			shortName,
		}); 
		return isErr(createResult) ? createResult : ok({ id });
	}
}

export const registerCreateLookupHandler = (container: any) => {
	container
		.bind(TYPES.Handler)
		.to(CreateLookupCommandHandler)
		.whenNamed(CREATE_LOOKUP_COMMAND_TYPE);
};
