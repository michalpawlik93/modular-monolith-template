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