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

export function retrieveReferences({ brief, routing, provider }) {
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
      questionsAsked: routing.pendingQuestions
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
      questionsAsked: []
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
    questionsAsked: []
  };
}
