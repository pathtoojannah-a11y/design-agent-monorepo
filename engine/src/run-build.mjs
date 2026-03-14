import { buildBuildSpec, buildClarificationResult } from "./adapter.mjs";
import { createCatalogProvider } from "./providers/catalog-provider.mjs";
import { createManualRuntimeProvider } from "./providers/manual-runtime-provider.mjs";
import { retrieveReferences } from "./retriever.mjs";
import { routeCategories } from "./router.mjs";

export function createProvider({ categoryIndex, references, providerKind = "catalog", runtimeData = {} }) {
  if (providerKind === "manual-runtime") {
    return createManualRuntimeProvider(runtimeData);
  }

  return createCatalogProvider({ references, categoryIndex });
}

export function runBuildFlow({
  brief,
  references,
  categoryIndex,
  providerKind = "catalog",
  runtimeData = {}
}) {
  const provider = createProvider({ categoryIndex, references, providerKind, runtimeData });
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
