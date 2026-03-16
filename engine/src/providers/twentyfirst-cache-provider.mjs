import path from "node:path";
import { fileExists, loadJson } from "../io.mjs";
import { getCachePaths, getItemDetailPath } from "../collector/cache-paths.mjs";
import { readCacheHealth } from "../collector/collector.mjs";

function loadCacheFile(cacheDir, fileName, fallback) {
  const filePath = path.resolve(cacheDir, fileName);
  if (!fileExists(filePath)) {
    return fallback;
  }

  return loadJson(filePath);
}

export function createTwentyFirstCacheProvider({
  cacheDir,
  maxAgeHours = 24
}) {
  const cachePaths = getCachePaths(cacheDir);
  const categories = loadCacheFile(cacheDir, "categories.json", []);
  const templates = loadCacheFile(cacheDir, "templates.json", []);
  const cacheHealth = readCacheHealth(cacheDir, maxAgeHours);

  return {
    kind: "21st-cache",
    cacheDir,
    listCategories() {
      return categories;
    },
    getCacheHealth() {
      return cacheHealth;
    },
    getCategoryCoverage(categoryName) {
      const itemCount = cacheHealth.itemCountsByCategory?.[categoryName] ?? 0;

      return {
        categoryName,
        status: itemCount > 0 ? "covered" : "missing",
        itemCount,
        categoryMissingItems: cacheHealth.categoriesMissingItems?.includes(categoryName) ?? false,
        categoryStale: cacheHealth.staleCategories?.includes(categoryName) ?? false
      };
    },
    getCategoryReferences(categoryName) {
      return templates.filter((reference) => reference.sourceCategory === categoryName);
    },
    getReferenceDetails(referenceId) {
      const itemPath = getItemDetailPath(cacheDir, referenceId);
      if (fileExists(itemPath)) {
        return loadJson(itemPath);
      }

      return templates.find((reference) => reference.id === referenceId) ?? null;
    },
    getItemDetails(referenceId) {
      const itemPath = getItemDetailPath(cacheDir, referenceId);
      return fileExists(itemPath) ? loadJson(itemPath) : null;
    },
    listItemDetails(categoryName) {
      return templates
        .filter((reference) => !categoryName || reference.sourceCategory === categoryName)
        .map((reference) => this.getItemDetails(reference.id))
        .filter(Boolean);
    },
    hasCategoryCoverage(categoryName) {
      return (cacheHealth.itemCountsByCategory?.[categoryName] ?? 0) > 0;
    }
  };
}
