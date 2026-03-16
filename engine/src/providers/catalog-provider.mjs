function flattenCategories(categoryIndex) {
  return categoryIndex.groups.flatMap((group) =>
    group.categories.map((category) => ({
      ...category,
      groupName: group.name
    }))
  );
}

export function createCatalogProvider({ references, categoryIndex }) {
  const categories = flattenCategories(categoryIndex);

  return {
    kind: "catalog",
    listCategories() {
      return categories;
    },
    getCategoryReferences(categoryName) {
      return references.filter((reference) => reference.sourceCategory === categoryName);
    },
    getReferenceDetails(referenceId) {
      return references.find((reference) => reference.id === referenceId) ?? null;
    },
    getItemDetails(referenceId) {
      return references.find((reference) => reference.id === referenceId) ?? null;
    },
    getCacheHealth() {
      return {
        status: "healthy",
        coverageStatus: "healthy",
        categoriesScanned: categories.map((category) => category.name),
        categoriesWithItems: categories.map((category) => category.name),
        categoriesMissingItems: [],
        itemCountsByCategory: Object.fromEntries(
          categories.map((category) => [
            category.name,
            references.filter((reference) => reference.sourceCategory === category.name).length
          ])
        ),
        staleCategories: [],
        needsRefresh: false
      };
    },
    getCategoryCoverage(categoryName) {
      const itemCount = references.filter((reference) => reference.sourceCategory === categoryName).length;
      return {
        categoryName,
        status: itemCount > 0 ? "covered" : "missing",
        itemCount,
        categoryMissingItems: itemCount === 0,
        categoryStale: false
      };
    }
  };
}
