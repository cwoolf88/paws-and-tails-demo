#!/usr/bin/env node
/**
 * Pins next-address-server-js to a local checkout (not the npm registry).
 * Usage:
 *   npm run install:sdk:local
 *   LOCAL_NEXT_ADDRESS_SERVER_JS=../other/next-address-server-js npm run install:sdk:local
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolvePath } from "./lib/resolveLocalSdkPath.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const raw = process.env.LOCAL_NEXT_ADDRESS_SERVER_JS || "../next-address-server-js";
const sdkPath = resolvePath(projectRoot, raw);
const pkg = path.join(sdkPath, "package.json");
if (!fs.existsSync(pkg)) {
  console.error("Could not find next-address-server-js (missing package.json):", sdkPath);
  process.exit(1);
}
if (!fs.existsSync(path.join(sdkPath, "dist", "index.js"))) {
  console.warn("Optional: build the SDK so dist/ exists — run: npm run sdk:rebuild:local");
}
const fileSpec = pathToFileURL(sdkPath).href;
console.log("Running: npm install", fileSpec);
execSync(`npm install ${JSON.stringify(fileSpec)} --save`, { cwd: projectRoot, stdio: "inherit" });
