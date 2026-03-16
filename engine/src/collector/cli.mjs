import {
  importTwentyFirstItems,
  inspectCollectedCategory,
  inspectCollectedInventory,
  inspectCollectedTemplate,
  readCacheHealth,
  readCollectionQueue,
  refreshTwentyFirstCache
} from "./collector.mjs";
import { loadJson, resolveFromRoot } from "../io.mjs";
import { getDefaultCacheDir } from "./cache-paths.mjs";

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
} else {
  throw new Error(`Unknown collector command: ${command}`);
}
