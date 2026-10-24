import { spawn } from "node:child_process";
const env = { ...process.env, VITE_DATA_MODE: "api" };
const backend = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "server/index.mjs"],
  { stdio: "inherit", env },
);
const frontend = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "4173"],
  { stdio: "inherit", env },
);
const stop = () => {
  backend.kill();
  frontend.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of [backend, frontend])
  child.on("exit", (code) => {
    stop();
    process.exit(code || 0);
  });
