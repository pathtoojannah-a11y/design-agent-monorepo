import path from "node:path";
import { resolveFromRoot } from "../io.mjs";

export function getDefaultCacheDir() {
  return resolveFromRoot(".local", "21st-cache");
}

function encodeItemId(itemId) {
  return encodeURIComponent(itemId).replace(/%/g, "_");
}

export function getCachePaths(cacheDir = getDefaultCacheDir()) {
  return {
    root: cacheDir,
    categories: path.resolve(cacheDir, "categories.json"),
    templates: path.resolve(cacheDir, "templates.json"),
    collectionState: path.resolve(cacheDir, "collection-state.json"),
    itemsDir: path.resolve(cacheDir, "items")
  };
}

export function getItemDetailPath(cacheDir = getDefaultCacheDir(), itemId) {
  return path.resolve(getCachePaths(cacheDir).itemsDir, `${encodeItemId(itemId)}.json`);
}
