import { Container } from 'inversify';
import { type LoggerConfig, registerLogging, RequestContext, registerCoreSagaRepository, CORE_SAGA_REPOSITORY } from './features';
import { CORE_MONGO_TOKENS, MongoConfig, MongoConnection, registerMongoConnection } from './providers';
import { MongoSagaRepository } from './features';
import { bindRequestContext, isErr } from './utils';

export interface CoreModuleConfig {
  logger: LoggerConfig;
  mongo: MongoConfig;
  requestContext?: RequestContext;
}

export const createCoreModuleContainer = (
  config: CoreModuleConfig,
): Container => {
  const container = new Container();
  container.bind<Container>(Container).toConstantValue(container);

  bindRequestContext(container, config.requestContext);
  registerLogging(container, config.logger);
  registerMongoConnection(container, config.mongo, CORE_MONGO_TOKENS);
  registerCoreSagaRepository(container);

  return container;
};

export const connectCoreInfrastructure = async (
  container: Container,
): Promise<void> => {
  if (!container.isBound(CORE_MONGO_TOKENS.MONGOCONNECTION_KEY)) {
    return;
  }

  const mongo = container.get<MongoConnection>(CORE_MONGO_TOKENS.MONGOCONNECTION_KEY);
  const result = await mongo.connect(() => {});
  if (isErr(result)) {
    console.error(result.error.message);
    return;
  }
};

export const disconnectCoreInfrastructure = async (
  container: Container,
): Promise<void> => {
  try {
    if (container.isBound(CORE_MONGO_TOKENS.MONGOCONNECTION_KEY)) {
      const mongo = container.get<MongoConnection>(
        CORE_MONGO_TOKENS.MONGOCONNECTION_KEY,
      );
      await mongo.close(() => {});
    }
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
};


