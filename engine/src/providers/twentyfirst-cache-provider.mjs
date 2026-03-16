import path from "node:path";
import { fileExists, loadJson } from "../io.mjs";
import { buildResolvedPromptRecipe } from "../collector/collector.mjs";
import { getCachePaths, getItemDetailPath } from "../collector/cache-paths.mjs";
import { inspectCollectedInventory, readCacheHealth, readCollectionQueue } from "../collector/collector.mjs";

function loadCacheFile(cacheDir, fileName, fallback) {
  const filePath = path.resolve(cacheDir, fileName);
  if (!fileExists(filePath)) {
    return fallback;
  }

  return loadJson(filePath);
}

function loadItemDetail(cacheDir, referenceId) {
  const itemPath = getItemDetailPath(cacheDir, referenceId);
  if (!fileExists(itemPath)) {
    return null;
  }

  const detail = loadJson(itemPath);

  return {
    ...detail,
    resolvedPromptRecipe: buildResolvedPromptRecipe(detail)
  };
}

function loadInventory(cacheDir) {
  return inspectCollectedInventory({ cacheDir });
}

export function createTwentyFirstCacheProvider({
  cacheDir,
  maxAgeHours = 24
}) {
  const cachePaths = getCachePaths(cacheDir);
  const categories = loadCacheFile(cacheDir, "categories.json", []);
  const templates = loadCacheFile(cacheDir, "templates.json", []);
  const cacheHealth = readCacheHealth(cacheDir, maxAgeHours);
  const inventory = loadInventory(cacheDir);
  const queue = readCollectionQueue(cacheDir);

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
    getInventory() {
      return inventory;
    },
    getCollectionQueue() {
      return queue;
    },
    getItemStatus(referenceId) {
      return inventory.find((entry) => entry.id === referenceId) ?? null;
    },
    getCategoryReferences(categoryName) {
      return templates.filter((reference) => reference.sourceCategory === categoryName);
    },
    getReferenceDetails(referenceId) {
      const detail = loadItemDetail(cacheDir, referenceId);
      if (detail) {
        return detail;
      }

      return templates.find((reference) => reference.id === referenceId) ?? null;
    },
    getItemDetails(referenceId) {
      return loadItemDetail(cacheDir, referenceId);
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
