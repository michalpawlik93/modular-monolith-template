import 'reflect-metadata';
import { ACCOUNT_FACADE_TOKEN, cleanConnections, IAccountBaseFacade, IProductBaseFacade, ModuleContainer, PRODUCT_FACADE_TOKEN, setupConnections, runWithContext } from "@app/core";
import { setupContainer } from "./di";
import { runConsole } from "./application/console";

let modules: ModuleContainer[] | null = null;

async function main() {
    const {
      modules: moduleInstances,
      requestContext,
    } = await setupContainer();
    modules = Object.values(moduleInstances);
    await setupConnections(modules);
    const accountFacade = moduleInstances.accounts.container.get<IAccountBaseFacade>(ACCOUNT_FACADE_TOKEN);
    const productFacade = moduleInstances.products.container.get<IProductBaseFacade>(PRODUCT_FACADE_TOKEN);
    await runWithContext(requestContext,async () => {
      await runConsole({ accountFacade, productFacade });
    });
}

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await cleanConnections(modules ?? undefined);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanConnections(modules ?? undefined);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await cleanConnections(modules ?? undefined);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await cleanConnections(modules ?? undefined);
  process.exit(0);
});

main().catch(async (error) => {
  console.error('Fatal error in main:', error);
  await cleanConnections(modules ?? undefined);
  process.exit(1);
});
