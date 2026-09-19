#!/usr/bin/env node
// Starts the built production server when a build exists (VPS / PM2),
// otherwise falls back to the Vite dev server (Lovable preview, local work).
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

// Vite loads .env automatically in dev; the production server does not.
function loadEnvFile(file) {
  const path = resolve(root, file);
  if (!existsSync(path)) return {};

  const values = {};
  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) values[key] = value;
  }
  return values;
}

const REQUIRED_ENV = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"];
const OPTIONAL_ENV = ["SUPABASE_SERVICE_ROLE_KEY", "ANOSIM_API_KEY", "TELEGRAM_BOT_TOKEN"];

// Nitro's node-server preset emits .output/ by default; Lovable builds emit dist/.
const serverEntry = [".output/server/index.mjs", "dist/server/index.mjs"]
  .map((candidate) => resolve(root, candidate))
  .find((candidate) => existsSync(candidate));

if (serverEntry) {
  const host = readFlag("host") || process.env.HOST || "0.0.0.0";
  const port = readFlag("port") || process.env.PORT || "3000";

  // Real environment variables win over the files.
  const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.production") };
  const env = { ...fileEnv, ...process.env, NODE_ENV: "production", HOST: host, PORT: String(port) };

  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  if (missing.length > 0) {
    console.error(
      `[start] Abbruch: Folgende Angaben fehlen: ${missing.join(", ")}.\n` +
        `        Trage sie in die Datei .env (oder .env.production) im Projektordner ein\n` +
        `        oder setze sie als Umgebungsvariablen und starte erneut.`,
    );
    process.exit(1);
  }

  const missingOptional = OPTIONAL_ENV.filter((key) => !env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `[start] Hinweis: ${missingOptional.join(", ")} nicht gesetzt — ` +
        `die davon abhängigen Funktionen (Mitarbeiterverwaltung, Telefonnummern, Telegram) bleiben deaktiviert.`,
    );
  }

  console.log(`[start] production server on http://${host}:${port}`);

  const child = spawn(process.execPath, [serverEntry], { stdio: "inherit", cwd: root, env });
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
