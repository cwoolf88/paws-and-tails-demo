#!/usr/bin/env node
import { execSync } from "node:child_process";
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
console.log("Building SDK in:", sdkPath);
execSync("npm run build", { cwd: sdkPath, stdio: "inherit" });
