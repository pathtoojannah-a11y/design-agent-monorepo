import { inspectCollectedCategory, inspectCollectedTemplate, refreshTwentyFirstCache } from "./collector.mjs";
import { loadJson, resolveFromRoot } from "../io.mjs";
import { getDefaultCacheDir } from "./cache-paths.mjs";

function getArgValue(args, prefix, fallback = null) {
  const entry = args.find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : fallback;
}

const args = process.argv.slice(2);
const command = args[0] ?? "refresh";
const cacheDir = getArgValue(args, "--cache-dir=", getDefaultCacheDir());

if (command === "refresh") {
  const sourceFile = getArgValue(args, "--source-file=", "./examples/runtime/twentyfirst-session-export.json");
  const staleAware = args.includes("--stale-aware");
  const maxAgeHours = Number(getArgValue(args, "--max-age-hours=", "24"));
  const baselineCategoryIndex = loadJson(resolveFromRoot("catalog", "category-index.json"));
  const result = refreshTwentyFirstCache({
    sourceFile,
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
} else {
  throw new Error(`Unknown collector command: ${command}`);
}
