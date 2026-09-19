#!/usr/bin/env node
// Starts the built production server when a build exists (VPS / PM2),
// otherwise falls back to the Vite dev server (Lovable preview, local work).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.findIndex((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (index === -1) return undefined;
  const arg = args[index];
  if (arg.includes("=")) return arg.slice(arg.indexOf("=") + 1);
  const next = args[index + 1];
  return next && !next.startsWith("--") ? next : undefined;
}

const serverEntry = resolve(root, ".output/server/index.mjs");

if (existsSync(serverEntry)) {
  const host = readFlag("host") || process.env.HOST || "0.0.0.0";
  const port = readFlag("port") || process.env.PORT || "3000";

  console.log(`[start] production server on http://${host}:${port}`);

  const child = spawn(process.execPath, [serverEntry], {
    stdio: "inherit",
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", HOST: host, PORT: String(port) },
  });
  child.on("exit", (code) => process.exit(code ?? 0));
} else {
  console.log("[start] no production build found — starting Vite dev server");

  const child = spawn("vite", ["dev", ...args], {
    stdio: "inherit",
    cwd: root,
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}
