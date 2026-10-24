import { spawnSync } from "node:child_process";
const mode = process.argv[2] === "api" ? "api" : "demo";
const env = { ...process.env, VITE_DATA_MODE: mode };
console.log(`Building Solehaven in ${mode.toUpperCase()} mode.`);
for (const [file, args] of [
  ["node_modules/typescript/bin/tsc", ["-b"]],
  ["node_modules/vite/bin/vite.js", ["build"]],
]) {
  const result = spawnSync(process.execPath, [file, ...args], {
    stdio: "inherit",
    env,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
