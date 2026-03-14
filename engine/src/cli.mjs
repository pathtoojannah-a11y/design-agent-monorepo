import { composeBuildSpec } from "./compose.mjs";
import { loadJson, resolveFromRoot } from "./io.mjs";

const briefArg = process.argv[2] ?? "./examples/briefs/contractor-roofing.json";

const brief = loadJson(resolveFromRoot(briefArg));
const references = loadJson(resolveFromRoot("./catalog/references.json"));
const spec = composeBuildSpec(brief, references);

console.log(JSON.stringify(spec, null, 2));
