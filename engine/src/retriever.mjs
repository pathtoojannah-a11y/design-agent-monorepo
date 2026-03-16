import { chooseSection } from "./scoring.mjs";

function summarizeConfidence(brief, selectedSections, missingSections, activeSignals, pendingQuestions) {
  const averageScore = selectedSections.length === 0
    ? 0
    : Math.round(
      selectedSections.reduce((sum, section) => sum + section.score, 0) /
      selectedSections.length
    );
  const coverageRatio = brief.requiredSections.length === 0
    ? 1
    : selectedSections.length / brief.requiredSections.length;

  let level = "high";
  const reasons = [];

  if (coverageRatio < 1) {
    level = "medium";
    reasons.push(`Missing sections: ${missingSections.join(", ")}`);
  }

  if (averageScore < 75) {
    level = level === "high" ? "medium" : "low";
    reasons.push(`Average section score is ${averageScore}, so retrieval may need broader inspection.`);
  }

  if (pendingQuestions.length > 0) {
    level = "low";
    reasons.push("A clarification could materially change which categories should be inspected.");
  }

  return {
    level,
    averageSectionScore: averageScore,
    matchedSections: selectedSections.length,
    requestedSections: brief.requiredSections.length,
    missingSections,
    activeSignals,
    reasons
  };
}

function selectSections(referencePool, brief) {
  const selectedSections = [];
  const sectionRationale = [];
  const chosenReferences = [];
  const missingSections = [];

  for (const sectionType of brief.requiredSections) {
    const winner = chooseSection(referencePool, brief, sectionType);

    if (!winner) {
      missingSections.push(sectionType);
      continue;
    }

    chosenReferences.push(winner.reference);
    selectedSections.push({
      sectionType,
      referenceId: winner.reference.id,
      sourceName: winner.reference.sourceName,
      sourceUrl: winner.reference.sourceUrl,
      screenshot: winner.reference.screenshot,
      score: winner.score,
      sourceCategory: winner.reference.sourceCategory,
      categoryGroup: winner.reference.categoryGroup
    });

    sectionRationale.push(
      `${sectionType}: ${winner.reference.notes} Reasons: ${winner.reasons.join("; ")}`
    );
  }

  return { selectedSections, sectionRationale, chosenReferences, missingSections };
}

function getExpandedCategories(selectedSections, primaryCategories) {
  const primarySet = new Set(primaryCategories);
  return [...new Set(
    selectedSections
      .map((section) => section.sourceCategory)
      .filter((category) => !primarySet.has(category))
  )];
}

function getProviderHealth(provider) {
  return provider.getCacheHealth?.() ?? {
    status: "healthy",
    coverageStatus: "healthy",
    categoriesMissingItems: [],
    staleCategories: [],
    needsRefresh: false
  };
}

function getCoverageWarnings(provider, categories) {
  return categories
    .map((categoryName) => provider.getCategoryCoverage?.(categoryName))
    .filter(Boolean)
    .filter((coverage) => coverage.categoryMissingItems || coverage.categoryStale)
    .map((coverage) => ({
      categoryName: coverage.categoryName,
      status: coverage.categoryMissingItems ? "missing" : "stale",
      itemCount: coverage.itemCount
    }));
}

function getComponentRecipes(provider, categories) {
  const seen = new Set();
  const recipes = [];

  for (const category of categories) {
    const references = provider.getCategoryReferences(category);
    for (const reference of references) {
      const detail = provider.getItemDetails?.(reference.id);
      const itemStatus = provider.getItemStatus?.(reference.id) ?? null;
      if (!detail?.normalizedRecipe || seen.has(detail.id)) {
        continue;
      }

      seen.add(detail.id);
      recipes.push({
        id: detail.id,
        sourceName: detail.sourceName,
        sourceCategory: detail.sourceCategory,
        itemKind: detail.itemKind ?? reference.itemKind ?? "section",
        targetStack: detail.normalizedRecipe.targetStack,
        destinationPaths: detail.normalizedRecipe.destinationPaths,
        install: detail.normalizedRecipe.install,
        supportFiles: detail.normalizedRecipe.supportFiles,
        adaptationNotes: detail.normalizedRecipe.adaptationNotes,
        promptRecipe: detail.promptRecipe ?? null,
        resolvedPromptRecipe: detail.resolvedPromptRecipe ?? detail.promptRecipe ?? null,
        completenessStatus: itemStatus?.status ?? null,
        missingFields: itemStatus?.missingFields ?? [],
        provenance: {
          source: provider.kind,
          recipeStatus: itemStatus?.status ?? null
        }
      });
    }
  }

  return recipes;
}

export function retrieveReferences({ brief, routing, provider }) {
  const cacheHealth = getProviderHealth(provider);
  const primaryCoverageWarnings = getCoverageWarnings(provider, routing.primaryCategories);
  const primaryReferences = routing.primaryCategories.flatMap((category) =>
    provider.getCategoryReferences(category)
  );

  const initialSelection = selectSections(primaryReferences, brief);
  const initialConfidence = summarizeConfidence(
    brief,
    initialSelection.selectedSections,
    initialSelection.missingSections,
    routing.activeSignals,
    routing.pendingQuestions
  );

  if (cacheHealth.status !== "healthy") {
    initialConfidence.level = initialConfidence.level === "low" ? "low" : "medium";
    initialConfidence.reasons.push(
      `21st cache is ${cacheHealth.status}, so broader collection may still be needed before treating results as complete.`
    );
  }

  if (routing.pendingQuestions.length > 0) {
    return {
      status: "needs_clarification",
      primaryCategories: routing.primaryCategories,
      optionalCategories: routing.optionalCategories,
      selectedSections: initialSelection.selectedSections,
      sectionRationale: initialSelection.sectionRationale,
      chosenReferences: initialSelection.chosenReferences,
      expandedCategories: [],
      confidenceSummary: initialConfidence,
      questionsAsked: routing.pendingQuestions,
      cacheHealth,
      coverageWarnings: primaryCoverageWarnings,
      componentRecipes: getComponentRecipes(provider, routing.primaryCategories)
    };
  }

  const shouldExpand =
    routing.optionalCategories.length > 0 &&
    (
      initialSelection.missingSections.length > 0 ||
      initialConfidence.averageSectionScore < 75
    );

  if (!shouldExpand) {
    return {
      status: "ready",
      primaryCategories: routing.primaryCategories,
      optionalCategories: routing.optionalCategories,
      selectedSections: initialSelection.selectedSections,
      sectionRationale: initialSelection.sectionRationale,
      chosenReferences: initialSelection.chosenReferences,
      expandedCategories: [],
      confidenceSummary: initialConfidence,
      questionsAsked: [],
      cacheHealth,
      coverageWarnings: primaryCoverageWarnings,
      componentRecipes: getComponentRecipes(provider, routing.primaryCategories)
    };
  }

  const expandedReferences = routing.optionalCategories.flatMap((category) =>
    provider.getCategoryReferences(category)
  );
  const expandedSelection = selectSections(
    primaryReferences.concat(expandedReferences),
    brief
  );

  return {
    status: "ready",
    primaryCategories: routing.primaryCategories,
    optionalCategories: routing.optionalCategories,
    selectedSections: expandedSelection.selectedSections,
    sectionRationale: expandedSelection.sectionRationale,
    chosenReferences: expandedSelection.chosenReferences,
    expandedCategories: getExpandedCategories(
      expandedSelection.selectedSections,
      routing.primaryCategories
    ),
    confidenceSummary: summarizeConfidence(
      brief,
      expandedSelection.selectedSections,
      expandedSelection.missingSections,
      routing.activeSignals,
      []
    ),
    questionsAsked: [],
    cacheHealth,
    coverageWarnings: uniqueCoverageWarnings(
      primaryCoverageWarnings,
      getCoverageWarnings(provider, routing.optionalCategories)
    ),
    componentRecipes: getComponentRecipes(
      provider,
      [...routing.primaryCategories, ...routing.optionalCategories]
    )
  };
}

function uniqueCoverageWarnings(primaryWarnings, expandedWarnings) {
  const warnings = new Map();

  for (const warning of [...primaryWarnings, ...expandedWarnings]) {
    warnings.set(warning.categoryName, warning);
  }

  return [...warnings.values()];
}
