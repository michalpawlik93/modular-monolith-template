import 'reflect-metadata';
import { cleanConnections, GrpcCommandBusServer, ModuleContainer, setupConnections } from '@app/core';
import {
  setupContainer,
} from './di';
import { getGrpcServerAddress } from './config';


let modules: ModuleContainer[] | null = null;

async function main(): Promise<void> {
    const {
      modules: moduleInstances,
      appContainer
    } = await setupContainer();
    modules = Object.values(moduleInstances);
    await setupConnections(modules);

  const server = appContainer.get(GrpcCommandBusServer);
  const address = getGrpcServerAddress();
  await server.start(address);

  let isShuttingDown = false;
  const shutdown = async (reason: string, exitCode = 0) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    try {
      await server.stop();
    } catch (error) {
      console.error('Error stopping gRPC server:', error);
      exitCode = exitCode || 1;
    }

    try {
      await cleanConnections();
    } catch (error) {
      console.error('Error disconnecting infrastructure:', error);
      exitCode = exitCode || 1;
    }

    if (reason) {
      console.log(`${reason} received, shutting down.`);
    }
    process.exit(exitCode);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await shutdown('unhandledRejection', 1);
  });

  console.log(`gRPC CommandBus server listening on ${address}`);
}

main().catch(async (error) => {
  console.error('Fatal error during startup:', error);
  await cleanConnections();
  process.exit(1);
});
