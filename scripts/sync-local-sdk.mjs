#!/usr/bin/env node
/**
 * Builds the local anemone-server-js checkout and reinstalls it in this demo.
 *
 * Usage:
 *   npm run sdk:sync:local
 *   LOCAL_ANEMONE_SERVER_JS=../other/anemone-server-js npm run sdk:sync:local
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePath } from "./lib/resolveLocalSdkPath.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const raw =
  process.env.LOCAL_ANEMONE_SERVER_JS?.trim() ||
  process.env.LOCAL_ANEMONE_SERVER_JS?.trim() ||
  "../anemone-server-js";
const sdkPath = resolvePath(projectRoot, raw);
const pkg = path.join(sdkPath, "package.json");

if (!fs.existsSync(pkg)) {
  console.error("Could not find anemone-server-js (missing package.json):", sdkPath);
  process.exit(1);
}

console.log("Building SDK in:", sdkPath);
execSync("npm run build", { cwd: sdkPath, stdio: "inherit" });

console.log("Updating local dependency in:", projectRoot);
execSync("npm run install:sdk:local", {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env, LOCAL_ANEMONE_SERVER_JS: raw },
});

console.log("SDK rebuilt and demo dependency updated.");
