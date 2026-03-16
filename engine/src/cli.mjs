import { composeBuildSpec } from "./compose.mjs";
import { readCacheHealth } from "./collector/collector.mjs";
import { getDefaultCacheDir } from "./collector/cache-paths.mjs";
import { loadJson, resolveFromRoot } from "./io.mjs";

const args = process.argv.slice(2);
const briefArg = args.find((arg) => !arg.startsWith("--")) ?? "./examples/briefs/contractor-roofing.json";
const providerArg = args.find((arg) => arg.startsWith("--provider="));
const runtimeFileArg = args.find((arg) => arg.startsWith("--runtime-file="));
const cacheDirArg = args.find((arg) => arg.startsWith("--cache-dir="));
const maxAgeArg = args.find((arg) => arg.startsWith("--max-age-hours="));

const brief = loadJson(resolveFromRoot(briefArg));
const references = loadJson(resolveFromRoot("./catalog/references.json"));
const categoryIndex = loadJson(resolveFromRoot("./catalog/category-index.json"));
const runtimeData = runtimeFileArg
  ? loadJson(resolveFromRoot(runtimeFileArg.replace("--runtime-file=", "")))
  : {};
const cacheDir = cacheDirArg
  ? resolveFromRoot(cacheDirArg.replace("--cache-dir=", ""))
  : getDefaultCacheDir();
const maxAgeHours = maxAgeArg ? Number(maxAgeArg.replace("--max-age-hours=", "")) : 24;
const detectedCacheHealth = readCacheHealth(cacheDir, maxAgeHours);
const providerKind = providerArg
  ? providerArg.replace("--provider=", "")
  : detectedCacheHealth.status === "missing"
    ? "catalog"
    : "21st-cache";
const spec = composeBuildSpec(brief, references, categoryIndex, {
  providerKind,
  runtimeData,
  cacheDir,
  maxAgeHours
});

console.log(JSON.stringify(spec, null, 2));
