import { Container } from 'inversify';
import { bindOrRebind } from '../../utils/inversify';

export const registerPrismaSingleton = <T>(
  container: Container,
  token: symbol,
  factory: () => T,
): T => {
  bindOrRebind(container, token, () => {
    container.bind<T>(token).toDynamicValue(factory).inSingletonScope();
  });

  return container.get<T>(token);
};
