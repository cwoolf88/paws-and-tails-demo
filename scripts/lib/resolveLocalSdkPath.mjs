import path from "node:path";
import os from "node:os";

/**
 * @param {string} projectRoot
 * @param {string} p
 */
export function resolvePath(projectRoot, p) {
  if (p.startsWith("~/") || p === "~") {
    return path.join(os.homedir(), p === "~" ? "" : p.slice(2));
  }
  if (path.isAbsolute(p)) return p;
  return path.resolve(projectRoot, p);
}
