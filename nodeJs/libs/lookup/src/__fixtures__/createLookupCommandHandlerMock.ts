import { ok, Result, BasicError, Handler, Envelope, TYPES } from '@app/core';
import { Container, injectable } from 'inversify';
import { CREATE_LOOKUP_COMMAND_TYPE, CreateLookupCommand, CreateLookupResponse } from '../application/base/createLookupCommandHandler';

@injectable()
class CreateLookupCommandHandlerMock
	implements Handler<CreateLookupCommand, CreateLookupResponse>
{
	constructor(
		private result?: Promise<Result<CreateLookupResponse, BasicError>>
	) {}

	async handle(
		env: Envelope<CreateLookupCommand>
	): Promise<Result<CreateLookupResponse, BasicError>> {
		return (
			this.result ?? Promise.resolve(ok({ id: env.payload.id }))
		);
	}
}

export const mockCreateLookupCommandHandler = (
	container: Container,
	result?: Promise<Result<CreateLookupResponse, BasicError>>
): Container => {
	if (container.isBound(TYPES.Handler)) {
		container.unbindSync(TYPES.Handler);
	}

	container
		.bind<Handler<CreateLookupCommand>>(TYPES.Handler)
		.toConstantValue(new CreateLookupCommandHandlerMock(result))
		.whenNamed(CREATE_LOOKUP_COMMAND_TYPE);

	return container;
};
