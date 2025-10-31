import { Container } from "inversify";
import type { LoggerConfig } from "./LoggerConfig";
import type { ILogger } from "./ILogger";
import { LoggerFactory } from "./loggerFactory";
import { RequestContext } from "./requestContext";
import { TYPES } from "./types";

const bindOrRebind = <T>(container: Container, serviceIdentifier: symbol, binder: () => void) => {
  if (container.isBound(serviceIdentifier)) {
    container.unbind(serviceIdentifier);
  }
  binder();
};

export const registerLogging = (container: Container, config: LoggerConfig) => {
  bindOrRebind(container, TYPES.LoggerConfig, () => {
    container.bind<LoggerConfig>(TYPES.LoggerConfig).toConstantValue(config);
  });

  if (!container.isBound(TYPES.RequestContext)) {
    container.bind<RequestContext>(TYPES.RequestContext).to(RequestContext).inSingletonScope();
  }

  bindOrRebind(container, TYPES.LoggerFactory, () => {
    container.bind<LoggerFactory>(TYPES.LoggerFactory).to(LoggerFactory).inSingletonScope();
  });

  bindOrRebind(container, TYPES.BaseLogger, () => {
    container
      .bind<ILogger>(TYPES.BaseLogger)
      .toDynamicValue((ctx) =>  (ctx as unknown as { container: Container }).container.get<LoggerFactory>(TYPES.LoggerFactory).getBase())
      .inSingletonScope();
  });
};
