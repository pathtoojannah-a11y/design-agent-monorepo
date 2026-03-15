import { runBuildFlow } from "./run-build.mjs";

export function composeBuildSpec(brief, references, categoryIndex, options = {}) {
  return runBuildFlow({
    brief,
    references,
    categoryIndex,
    providerKind: options.providerKind ?? "catalog",
    runtimeData: options.runtimeData ?? {},
    cacheDir: options.cacheDir
  });
}
