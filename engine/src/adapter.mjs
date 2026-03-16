function dominant(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function buildVisualDirection(chosenReferences) {
  return {
    layout: dominant(chosenReferences.map((reference) => reference.visualTraits.layout)),
    background: dominant(
      chosenReferences.map((reference) => reference.visualTraits.background)
    ),
    cardStyle: dominant(
      chosenReferences.map((reference) => reference.visualTraits.cardStyle)
    ),
    motionStyle: dominant(
      chosenReferences.map((reference) => reference.visualTraits.motionStyle)
    )
  };
}

function buildBrandAdaptation(brief) {
  return {
    palette: {
      primary: brief.brand.primary,
      secondary: brief.brand.secondary,
      accent: brief.brand.accent,
      surface: brief.brand.surface,
      text: brief.brand.text
    },
    typography: {
      display: brief.brand.fontDisplay,
      body: brief.brand.fontBody
    },
    ui: {
      radius: brief.brand.radius,
      motion: brief.brand.motion
    },
    transformationRules: [
      "Keep the structural hierarchy of each chosen section, but replace all source color relationships with the target palette.",
      "Use the target display and body fonts consistently across every section.",
      "Unify border radius, spacing density, and motion cadence so the page feels like one designed system."
    ]
  };
}

function buildCopyDirection(brief) {
  return {
    audience: brief.targetAudience,
    headlineStyle: `${brief.tone.join(", ")} messaging tuned to ${brief.industry}`,
    ctaStyle: brief.siteType === "contractor lead generation"
      ? "Lead with estimate CTAs and keep a phone-first fallback visible."
      : "Lead with product value first, then support conversion with a secondary CTA.",
    trustSignals: brief.goals
  };
}

export function buildBuildSpec({ brief, retrieval }) {
  const globalVisualDirection = buildVisualDirection(retrieval.chosenReferences);
  const brandAdaptation = buildBrandAdaptation(brief);
  const copyDirection = buildCopyDirection(brief);

  const implementationPrompt = [
    `Build a ${brief.siteType} page for ${brief.projectName}.`,
    `Use these sections in order: ${retrieval.selectedSections.map((section) => section.sectionType).join(", ")}.`,
    `Visual direction: ${globalVisualDirection.layout}; ${globalVisualDirection.background}; ${globalVisualDirection.cardStyle}; ${globalVisualDirection.motionStyle}.`,
    `Brand system: ${brief.brand.primary}, ${brief.brand.secondary}, ${brief.brand.accent}, ${brief.brand.surface}, ${brief.brand.text}; display font ${brief.brand.fontDisplay}; body font ${brief.brand.fontBody}; radius ${brief.brand.radius}; motion ${brief.brand.motion}.`,
    `Copy direction: ${copyDirection.headlineStyle}. Target ${brief.goals.join(", ")} without cloning the source references.`
  ].join(" ");

  const warnings = [];
  if (retrieval.cacheHealth?.status && retrieval.cacheHealth.status !== "healthy") {
    warnings.push(
      `21st cache coverage is ${retrieval.cacheHealth.status}; refresh or expand the private cache before treating this as full-library output.`
    );
  }
  if ((retrieval.coverageWarnings ?? []).length > 0) {
    warnings.push(
      `Categories still missing or stale coverage: ${retrieval.coverageWarnings
        .map((warning) => warning.categoryName)
        .join(", ")}.`
    );
  }

  return {
    project: {
      projectName: brief.projectName,
      industry: brief.industry,
      siteType: brief.siteType
    },
    selectedSections: retrieval.selectedSections,
    sectionRationale: retrieval.sectionRationale,
    globalVisualDirection,
    brandAdaptation,
    copyDirection,
    implementationPrompt,
    constraints: [
      "Do not copy source copy, logos, illustrations, or trademarked brand language.",
      "Use references as structural inspiration only, then restyle into the target brand system.",
      "When combining sections from multiple sources, smooth spacing, tone, and CTA language so the final page reads as one product."
    ],
    componentRecipes: retrieval.componentRecipes ?? [],
    cacheHealth: retrieval.cacheHealth ?? null,
    coverageWarnings: retrieval.coverageWarnings ?? [],
    warnings,
    primaryCategories: retrieval.primaryCategories,
    expandedCategories: retrieval.expandedCategories,
    questionsAsked: retrieval.questionsAsked,
    confidenceSummary: retrieval.confidenceSummary
  };
}

export function buildClarificationResult({ brief, routing, retrieval }) {
  const question = retrieval.questionsAsked[0];

  return {
    status: "needs_clarification",
    project: {
      projectName: brief.projectName,
      industry: brief.industry,
      siteType: brief.siteType
    },
    primaryCategories: routing.primaryCategories,
    optionalCategories: routing.optionalCategories,
    expandedCategories: [],
    pendingQuestion: question,
    questionsAsked: retrieval.questionsAsked,
    cacheHealth: retrieval.cacheHealth ?? null,
    coverageWarnings: retrieval.coverageWarnings ?? [],
    confidenceSummary: retrieval.confidenceSummary,
    nextStep: `Add brief.clarifications.${question.signal} with a value like "marketing-only" or "needs-auth", then rerun.`
  };
}
