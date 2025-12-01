import { Container } from "inversify";
import { RequestContext } from "../features";

export const setupConnections = async (modules: ModuleContainer[]) => {
  for (const moduleContainer of modules) {
    await moduleContainer.connect();
  }
  return modules;
};

export async function cleanConnections(modules?: ModuleContainer[]) {
  if (!modules) {
    return;
  }

  for (const moduleContainer of [...modules].reverse()) {
    try {
      await moduleContainer.disconnect();
    } catch (error) {
      console.error(
        `Error disconnecting module ${moduleContainer.name}:`,
        error,
      );
    }
  }
}

export interface ModuleContainer {
  name: ModuleContainerName;
  container: Container;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export type ModuleContainerName = 'core' | 'accounts' | 'products';

export interface SetupResult {
  modules: {
    core: ModuleContainer;
    accounts: ModuleContainer;
    products: ModuleContainer;
  };
  requestContext: RequestContext;
  appContainer?: Container;
}