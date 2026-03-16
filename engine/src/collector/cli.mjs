import {
  importTwentyFirstItems,
  inspectCollectedCategory,
  inspectCollectedInventory,
  inspectCollectedTemplate,
  readCacheHealth,
  readCollectionQueue,
  refreshTwentyFirstCache
} from "./collector.mjs";
import { loadJson, resolveFromRoot, fileExists, saveJson, ensureDir } from "../io.mjs";
import { getDefaultCacheDir, getCachePaths, getItemDetailPath } from "./cache-paths.mjs";
import { fetchSitemapUrls } from "./sitemap-fetcher.mjs";
import { scrapeComponentPage } from "./component-scraper.mjs";
import { buildItemRecord } from "./item-builder.mjs";

function getArgValue(args, prefix, fallback = null) {
  const entry = args.find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : fallback;
}

function getArgValues(args, prefix) {
  return args
    .filter((arg) => arg.startsWith(prefix))
    .map((arg) => arg.slice(prefix.length));
}

const args = process.argv.slice(2);
const command = args[0] ?? "refresh";
const cacheDir = getArgValue(args, "--cache-dir=", getDefaultCacheDir());
const maxAgeHours = Number(getArgValue(args, "--max-age-hours=", "24"));

if (command === "refresh") {
  const sourceFiles = getArgValues(args, "--source-file=");
  const sourceDir = getArgValue(args, "--source-dir=");
  const staleAware = args.includes("--stale-aware");
  const baselineCategoryIndex = loadJson(resolveFromRoot("catalog", "category-index.json"));
  const result = refreshTwentyFirstCache({
    sourceFile:
      sourceFiles[0] ??
      (!sourceDir ? "./examples/runtime/twentyfirst-session-export.json" : undefined),
    sourceFiles,
    sourceDir,
    baselineCategoryIndex,
    cacheDir,
    staleAware,
    maxAgeHours
  });
  console.log(JSON.stringify(result, null, 2));
} else if (command === "inspect-category") {
  const categoryName = getArgValue(args, "--name=");
  if (!categoryName) {
    throw new Error("Missing --name for inspect-category");
  }
  console.log(JSON.stringify(inspectCollectedCategory({ cacheDir, categoryName }), null, 2));
} else if (command === "inspect-template") {
  const templateId = getArgValue(args, "--id=");
  if (!templateId) {
    throw new Error("Missing --id for inspect-template");
  }
  console.log(JSON.stringify(inspectCollectedTemplate({ cacheDir, templateId }), null, 2));
} else if (command === "coverage") {
  console.log(JSON.stringify(readCacheHealth(cacheDir, maxAgeHours), null, 2));
} else if (command === "inventory") {
  const status = getArgValue(args, "--status=");
  const categoryName = getArgValue(args, "--category=");
  console.log(JSON.stringify(inspectCollectedInventory({ cacheDir, status, categoryName }), null, 2));
} else if (command === "queue") {
  console.log(JSON.stringify(readCollectionQueue(cacheDir), null, 2));
} else if (command === "import-item") {
  const sourceFiles = getArgValues(args, "--source-file=");
  const baselineCategoryIndex = loadJson(resolveFromRoot("catalog", "category-index.json"));
  const result = importTwentyFirstItems({
    sourceFile: sourceFiles[0],
    sourceFiles,
    cacheDir,
    baselineCategoryIndex
  });
  console.log(JSON.stringify(result, null, 2));
} else if (command === "collect-from-sitemap") {
  const limit = Number(getArgValue(args, "--limit=", "0")) || 0;
  const categoryFilter = getArgValue(args, "--category=");
  const resume = args.includes("--resume");
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const baselineCategoryIndex = loadJson(resolveFromRoot("catalog", "category-index.json"));
  const cachePaths = getCachePaths(cacheDir);

  async function run() {
    console.log("Fetching sitemap...");
    const sitemapUrls = await fetchSitemapUrls({ cacheDir, force });
    console.log(`Found ${sitemapUrls.length} component URLs in sitemap.`);

    // Load existing inventory to support --resume
    const existingItems = new Set();
    if (resume && fileExists(cachePaths.inventory)) {
      const inventory = loadJson(cachePaths.inventory);
      for (const entry of inventory) {
        if (entry.status === "recipe-complete" && entry.sourceUrl) {
          existingItems.add(entry.sourceUrl);
        }
      }
      console.log(`Resuming: skipping ${existingItems.size} already-complete items.`);
    }

    let toProcess = sitemapUrls;

    // Filter by category if specified
    if (categoryFilter) {
      const { classifyComponent } = await import("./category-classifier.mjs");
      toProcess = toProcess.filter((entry) => {
        const classification = classifyComponent({ slug: entry.slug, title: entry.slug });
        return classification.category === categoryFilter;
      });
      console.log(`Filtered to ${toProcess.length} URLs matching category: ${categoryFilter}`);
    }

    // Filter out already-complete items when resuming
    if (resume) {
      toProcess = toProcess.filter((entry) => !existingItems.has(entry.url));
    }

    // Apply limit
    if (limit > 0) {
      toProcess = toProcess.slice(0, limit);
    }

    if (dryRun) {
      console.log(`Dry run: would collect ${toProcess.length} components.`);
      console.log(JSON.stringify(toProcess.slice(0, 10).map((e) => e.url), null, 2));
      if (toProcess.length > 10) {
        console.log(`... and ${toProcess.length - 10} more`);
      }
      return;
    }

    console.log(`Collecting ${toProcess.length} components...`);
    ensureDir(cachePaths.itemsDir);

    const results = [];
    const errors = [];
    let recipeComplete = 0;
    let metadataOnly = 0;

    for (let i = 0; i < toProcess.length; i++) {
      const entry = toProcess[i];
      const { creator, slug, url } = entry;

      try {
        const scraped = await scrapeComponentPage(url);

        if (!scraped) {
          errors.push({ url, error: "404 or empty" });
          console.log(`[${i + 1}/${toProcess.length}] ✗ ${slug} → 404`);
          continue;
        }

        const item = buildItemRecord({ ...scraped, slug }, { creator, slug });
        saveJson(getItemDetailPath(cacheDir, item.id), item);
        results.push(item);

        if (item.collectionStatus === "recipe-complete") {
          recipeComplete++;
        } else {
          metadataOnly++;
        }

        console.log(
          `[${i + 1}/${toProcess.length}] ✓ ${slug} → ${item.sourceCategory} (${item.collectionStatus})`
        );
      } catch (err) {
        errors.push({ url, error: err.message });
        console.log(`[${i + 1}/${toProcess.length}] ✗ ${slug} → ${err.message}`);
      }

      // Rate limit
      if (i < toProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Update inventory and collection state
    if (results.length > 0) {
      const existingInventory = fileExists(cachePaths.inventory) ? loadJson(cachePaths.inventory) : [];
      const existingCategories = fileExists(cachePaths.categories) ? loadJson(cachePaths.categories) : [];
      const existingTemplates = fileExists(cachePaths.templates) ? loadJson(cachePaths.templates) : [];

      // Merge new items into inventory
      const inventoryMap = new Map(existingInventory.map((e) => [e.id, e]));

      for (const item of results) {
        inventoryMap.set(item.id, {
          id: item.id,
          groupName: item.categoryGroup,
          categoryName: item.sourceCategory,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          previewUrl: item.previewUrl ?? "",
          status: item.collectionStatus,
          lastAttemptAt: item.lastSeenAt,
          lastCompletedAt: item.collectionStatus === "recipe-complete" ? item.lastSeenAt : null,
          missingFields: item.collectionStatus === "recipe-complete" ? [] : ["componentFiles"],
          notes: item.notes ?? "",
          itemKind: item.itemKind,
          promptRecipeCompleteness: {
            hasPromptMaterial: item.collectionStatus === "recipe-complete",
            missingFields: item.collectionStatus === "recipe-complete" ? [] : ["componentFiles"]
          }
        });
      }

      const mergedInventory = [...inventoryMap.values()].sort((a, b) => a.id.localeCompare(b.id));
      saveJson(cachePaths.inventory, mergedInventory);

      // Update templates index
      const templateMap = new Map(existingTemplates.map((e) => [e.id, e]));
      for (const item of results) {
        templateMap.set(item.id, {
          id: item.id,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          categoryGroup: item.categoryGroup,
          sourceCategory: item.sourceCategory,
          priority: item.priority,
          sectionType: item.sectionType,
          industries: item.industries ?? [],
          siteTypes: item.siteTypes ?? [],
          tone: item.tone ?? [],
          strengths: item.strengths ?? [],
          requiresFeatureSignals: item.requiresFeatureSignals ?? [],
          visualTraits: item.visualTraits ?? { layout: "unknown", background: "unknown", cardStyle: "unknown", motionStyle: "unknown" },
          notes: item.notes ?? "",
          screenshot: item.screenshot ?? "",
          previewUrl: item.previewUrl ?? "",
          description: item.description ?? "",
          itemKind: item.itemKind,
          lastSeenAt: item.lastSeenAt
        });
      }
      saveJson(cachePaths.templates, [...templateMap.values()].sort((a, b) => a.id.localeCompare(b.id)));

      // Update categories with new counts
      const categoryMap = new Map(existingCategories.map((c) => [c.name, c]));
      for (const item of results) {
        if (!categoryMap.has(item.sourceCategory) && item.sourceCategory !== "Uncategorized") {
          categoryMap.set(item.sourceCategory, {
            groupName: item.categoryGroup,
            name: item.sourceCategory,
            count: 0,
            mapsToSections: item.sectionType !== "unknown" ? [item.sectionType] : [],
            priority: item.priority,
            lastSeenAt: item.lastSeenAt
          });
        }
      }
      saveJson(cachePaths.categories, [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name)));

      // Update collection state with sitemap collection stats
      const collectionState = fileExists(cachePaths.collectionState)
        ? loadJson(cachePaths.collectionState)
        : {};

      collectionState.lastSitemapCollectionAt = new Date().toISOString();
      collectionState.sitemapCollectionStats = {
        totalUrls: sitemapUrls.length,
        collected: results.length,
        errors: errors.length,
        recipeComplete,
        metadataOnly,
        lastRunAt: new Date().toISOString()
      };

      // Recount items per category
      const allItems = mergedInventory;
      const itemCountsByCategory = {};
      for (const item of allItems) {
        const cat = item.categoryName ?? item.groupName;
        itemCountsByCategory[cat] = (itemCountsByCategory[cat] ?? 0) + 1;
      }
      collectionState.itemCountsByCategory = itemCountsByCategory;
      collectionState.totalItemsDiscovered = allItems.length;

      const itemStatusCounts = {
        "inventory-only": 0,
        "metadata-collected": 0,
        "partial-detail": 0,
        "recipe-complete": 0,
        "failed": 0
      };
      for (const item of allItems) {
        itemStatusCounts[item.status] = (itemStatusCounts[item.status] ?? 0) + 1;
      }
      collectionState.itemStatusCounts = itemStatusCounts;

      saveJson(cachePaths.collectionState, collectionState);
    }

    console.log("\nCollection complete:");
    console.log(`  Collected: ${results.length}`);
    console.log(`  Recipe-complete: ${recipeComplete}`);
    console.log(`  Metadata-only: ${metadataOnly}`);
    console.log(`  Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      for (const err of errors.slice(0, 10)) {
        console.log(`  ${err.url}: ${err.error}`);
      }
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more`);
      }
    }
  }

  run().catch((err) => {
    console.error("Collection failed:", err.message);
    process.exit(1);
  });
} else {
  throw new Error(`Unknown collector command: ${command}`);
}
