import path from "node:path";
import { fileExists, loadJson } from "../io.mjs";

function loadCacheFile(cacheDir, fileName, fallback) {
  const filePath = path.resolve(cacheDir, fileName);
  if (!fileExists(filePath)) {
    return fallback;
  }

  return loadJson(filePath);
}

export function createTwentyFirstCacheProvider({ cacheDir }) {
  const categories = loadCacheFile(cacheDir, "categories.json", []);
  const templates = loadCacheFile(cacheDir, "templates.json", []);

  return {
    kind: "21st-cache",
    cacheDir,
    listCategories() {
      return categories;
    },
    getCategoryReferences(categoryName) {
      return templates.filter((reference) => reference.sourceCategory === categoryName);
    },
    getReferenceDetails(referenceId) {
      return templates.find((reference) => reference.id === referenceId) ?? null;
    }
  };
}
