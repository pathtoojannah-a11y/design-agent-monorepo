export function createManualRuntimeProvider(runtimeData = {}) {
  const categories = runtimeData.categories ?? [];
  const references = runtimeData.references ?? [];

  return {
    kind: "manual-runtime",
    listCategories() {
      return categories;
    },
    getCategoryReferences(categoryName) {
      return references.filter((reference) => reference.sourceCategory === categoryName);
    },
    getReferenceDetails(referenceId) {
      return references.find((reference) => reference.id === referenceId) ?? null;
    }
  };
}
