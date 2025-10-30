import { Container } from "inversify";
import { cleanConnections, setupConnections, setupContainer } from "./di";

let container: Container | null = null;

async function main() {
    const {
      container: containerInstance,
    } = await setupContainer();
    container = containerInstance;
    await setupConnections(containerInstance);
}

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await cleanConnections(container);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanConnections(container);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await cleanConnections(container);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await cleanConnections(container);
  process.exit(0);
});

main().catch(async (error) => {
  console.error('Fatal error in main:', error);
  await cleanConnections(container);
  process.exit(1);
});
