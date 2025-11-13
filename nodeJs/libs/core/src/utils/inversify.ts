import { Container } from "inversify";

export const bindOrRebind = (
    container: Container,
    identifier: symbol,
    binder: () => void
  ) => {
    if (container.isBound(identifier)) {
      container.unbind(identifier);
    }
    binder();
  };

/**
 * Container with optional named binding extensions
 */
type ContainerWithNamedExtensions = Container & {
  isBoundNamed?: (
    id: unknown,
    named: string | number | symbol,
  ) => boolean;
  getNamed?: <TResult>(
    id: unknown,
    named: string | number | symbol,
  ) => TResult;
};

/**
 * Checks if a handler is bound for the given command type.
 * Supports both standard Inversify API and named binding extensions.
 */
export function isHandlerBound(
  container: Container,
  handlerType: symbol,
  commandType: string,
): boolean {
  const containerWithExtensions = container as ContainerWithNamedExtensions;
  
  if (typeof containerWithExtensions.isBoundNamed === 'function') {
    return containerWithExtensions.isBoundNamed(handlerType, commandType);
  }
  
  return container.isBound(handlerType, { name: commandType });
}

/**
 * Gets a handler for the given command type.
 * Supports both standard Inversify API and named binding extensions.
 */
export function getHandler<T>(
  container: Container,
  handlerType: symbol,
  commandType: string,
): T {
  const containerWithExtensions = container as ContainerWithNamedExtensions;
  
  if (typeof containerWithExtensions.getNamed === 'function') {
    return containerWithExtensions.getNamed<T>(handlerType, commandType);
  }
  
  return container.get<T>(handlerType, { name: commandType });
}