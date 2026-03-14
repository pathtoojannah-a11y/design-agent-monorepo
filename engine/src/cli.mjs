import { composeBuildSpec } from "./compose.mjs";
import { loadJson, resolveFromRoot } from "./io.mjs";

const args = process.argv.slice(2);
const briefArg = args.find((arg) => !arg.startsWith("--")) ?? "./examples/briefs/contractor-roofing.json";
const providerKind = args.includes("--provider=manual-runtime")
  ? "manual-runtime"
  : "catalog";
const runtimeFileArg = args.find((arg) => arg.startsWith("--runtime-file="));

const brief = loadJson(resolveFromRoot(briefArg));
const references = loadJson(resolveFromRoot("./catalog/references.json"));
const categoryIndex = loadJson(resolveFromRoot("./catalog/category-index.json"));
const runtimeData = runtimeFileArg
  ? loadJson(resolveFromRoot(runtimeFileArg.replace("--runtime-file=", "")))
  : {};
const spec = composeBuildSpec(brief, references, categoryIndex, {
  providerKind,
  runtimeData
});

console.log(JSON.stringify(spec, null, 2));
