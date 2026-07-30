import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

/** Default sibling checkout; override with env when the SDK is not in ../anemone-server-js. */
function localSdkPath(): string | null {
  const fromEnv =
    process.env.LOCAL_ANEMONE_SERVER_JS?.trim() ||
    process.env.LOCAL_ANEMONE_SERVER_JS?.trim();
  const p = fromEnv
    ? path.isAbsolute(fromEnv)
      ? fromEnv
      : path.resolve(appDir, fromEnv)
    : path.resolve(appDir, "..", "anemone-server-js");
  if (!fs.existsSync(path.join(p, "package.json"))) return null;
  return p;
}

const sdk = localSdkPath();

/**
 * `file:../` deps are outside the app. Turbopack (next dev --turbopack) will not
 * follow `file:` the same as Webpack. The official fix is to set `turbopack.root` to
 * a directory that contains the linked package, and use a **path relative to that
 * root** in `resolveAlias` (absolute paths get mangled into invalid `./Users/.../`
 * imports; see project root directory docs).
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#configuring-aliases
 */
function turbopackForLocalSdk(
  appRoot: string,
  absSdk: string,
): { root: string; resolveAlias: Record<string, string> } | null {
  const sdkResolved = path.resolve(absSdk);
  let root = path.join(appRoot, "..");
  for (let i = 0; i < 24; i += 1) {
    const rel = path.relative(root, sdkResolved);
    const forward = rel.split(path.sep).join("/");
    if (forward && !rel.startsWith("..") && !path.isAbsolute(rel)) {
      return { root, resolveAlias: { "anemone-server-js": forward } };
    }
    const up = path.dirname(root);
    if (up === root) break;
    root = up;
  }
  return null;
}

const sdkTurbopack = sdk ? turbopackForLocalSdk(appDir, sdk) : null;

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  transpilePackages: ["anemone-server-js"],
  ...(sdkTurbopack
    ? {
        turbopack: {
          root: sdkTurbopack.root,
          resolveAlias: sdkTurbopack.resolveAlias,
        },
      }
    : {}),
};

export default nextConfig;
