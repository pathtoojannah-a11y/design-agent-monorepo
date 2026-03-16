import { buildBuildSpec, buildClarificationResult } from "./adapter.mjs";
import { getDefaultCacheDir } from "./collector/cache-paths.mjs";
import { createCatalogProvider } from "./providers/catalog-provider.mjs";
import { createManualRuntimeProvider } from "./providers/manual-runtime-provider.mjs";
import { createTwentyFirstCacheProvider } from "./providers/twentyfirst-cache-provider.mjs";
import { retrieveReferences } from "./retriever.mjs";
import { routeCategories } from "./router.mjs";

export function createProvider({
  categoryIndex,
  references,
  providerKind = "catalog",
  runtimeData = {},
  cacheDir = getDefaultCacheDir(),
  maxAgeHours = 24
}) {
  if (providerKind === "manual-runtime") {
    return createManualRuntimeProvider(runtimeData);
  }

  if (providerKind === "21st-cache") {
    return createTwentyFirstCacheProvider({ cacheDir, maxAgeHours });
  }

  return createCatalogProvider({ references, categoryIndex });
}

export function runBuildFlow({
  brief,
  references,
  categoryIndex,
  providerKind = "catalog",
  runtimeData = {},
  cacheDir = getDefaultCacheDir(),
  maxAgeHours = 24
}) {
  const provider = createProvider({
    categoryIndex,
    references,
    providerKind,
    runtimeData,
    cacheDir,
    maxAgeHours
  });
  const routing = routeCategories({
    brief,
    categoryIndex,
    availableCategories: provider.listCategories()
  });
  const retrieval = retrieveReferences({ brief, routing, provider });

  if (retrieval.status === "needs_clarification") {
    return buildClarificationResult({ brief, routing, retrieval });
  }

  return buildBuildSpec({ brief, retrieval });
}
