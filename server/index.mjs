import { createApp } from "./app.mjs";
const { app, db } = createApp();
const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () =>
  console.log(`Solehaven API ready: http://localhost:${port}/api/health`),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
