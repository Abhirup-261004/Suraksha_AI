import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";
import { seedReportsIfEmpty } from "./services/reportService.js";

async function startServer() {
  await connectDatabase();
  await seedReportsIfEmpty();

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    console.log(`Suraksha AI backend running on http://${config.host}:${config.port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${config.port} is already in use. Stop the existing process or run the backend with a different PORT value.`
      );
      process.exit(1);
    }

    if (error.code === "EACCES" || error.code === "EPERM") {
      console.error(
        `The backend could not bind to ${config.host}:${config.port}. Try another HOST/PORT or check local permissions.`
      );
      process.exit(1);
    }

    console.error("Backend startup failed.", error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error("Failed to initialize backend services.", error);
  process.exit(1);
});
