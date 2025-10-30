import { Container } from 'inversify';
import {
  GetPagedLookupsCommand,
  GetPagedLookupsCommandHandler,
} from './getPagedLookupsCommandHandler';

export const registerLookupsCommandHandlers = (container: Container) => {
  container
    .bind<GetPagedLookupsCommandHandler>(GetPagedLookupsCommand.name)
    .to(GetPagedLookupsCommandHandler);
};
