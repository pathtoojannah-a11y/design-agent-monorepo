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
    }
  };
}
