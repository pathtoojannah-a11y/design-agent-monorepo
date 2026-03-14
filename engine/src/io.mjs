import fs from "node:fs";
import path from "node:path";

export function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function resolveFromRoot(...segments) {
  return path.resolve(process.cwd(), ...segments);
}
