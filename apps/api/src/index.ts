import { loadEnv } from "./config/env.js";
import { buildApp } from "./app.js";
import { QUEUE_NAMES } from "@screenshot-api/shared";

async function main() {
  const env = loadEnv();
  const app = await buildApp(env);

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   📸 Screenshot API Server              │
  │                                         │
  │   → http://localhost:${env.PORT}             │
  │   → Environment: ${env.NODE_ENV.padEnd(18)}│
  │   → Storage: ${env.STORAGE_PROVIDER.padEnd(23)}│
  │   → Queue: ${QUEUE_NAMES.SCREENSHOT.padEnd(25)}│
  │                                         │
  └─────────────────────────────────────────┘
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  }
}

main();
