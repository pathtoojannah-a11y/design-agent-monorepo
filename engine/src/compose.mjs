import { chooseSection } from "./scoring.mjs";

function dominant(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function composeBuildSpec(brief, references) {
  const selectedSections = [];
  const sectionRationale = [];
  const chosenReferences = [];

  for (const sectionType of brief.requiredSections) {
    const winner = chooseSection(references, brief, sectionType);
    if (!winner) {
      continue;
    }

    chosenReferences.push(winner.reference);
    selectedSections.push({
      "sectionType": sectionType,
      "referenceId": winner.reference.id,
      "sourceName": winner.reference.sourceName,
      "sourceUrl": winner.reference.sourceUrl,
      "screenshot": winner.reference.screenshot,
      "score": winner.score
    });

    sectionRationale.push(
      `${sectionType}: ${winner.reference.notes} Reasons: ${winner.reasons.join("; ")}`
    );
  }

  const globalVisualDirection = {
    "layout": dominant(chosenReferences.map((reference) => reference.visualTraits.layout)),
    "background": dominant(
      chosenReferences.map((reference) => reference.visualTraits.background)
    ),
    "cardStyle": dominant(
      chosenReferences.map((reference) => reference.visualTraits.cardStyle)
    ),
    "motionStyle": dominant(
      chosenReferences.map((reference) => reference.visualTraits.motionStyle)
    )
  };

  const brandAdaptation = {
    "palette": {
      "primary": brief.brand.primary,
      "secondary": brief.brand.secondary,
      "accent": brief.brand.accent,
      "surface": brief.brand.surface,
      "text": brief.brand.text
    },
    "typography": {
      "display": brief.brand.fontDisplay,
      "body": brief.brand.fontBody
    },
    "ui": {
      "radius": brief.brand.radius,
      "motion": brief.brand.motion
    },
    "transformationRules": [
      "Keep the structural hierarchy of each chosen section, but replace all source color relationships with the target palette.",
      "Use the target display and body fonts consistently across every section.",
      "Unify border radius, spacing density, and motion cadence so the page feels like one designed system."
    ]
  };

  const copyDirection = {
    "audience": brief.targetAudience,
    "headlineStyle": `${brief.tone.join(", ")} messaging tuned to ${brief.industry}`,
    "ctaStyle": brief.siteType === "contractor lead generation"
      ? "Lead with estimate CTAs and keep a phone-first fallback visible."
      : "Lead with product value first, then support conversion with a secondary CTA.",
    "trustSignals": brief.goals
  };

  const implementationPrompt = [
    `Build a ${brief.siteType} page for ${brief.projectName}.`,
    `Use these sections in order: ${selectedSections.map((section) => section.sectionType).join(", ")}.`,
    `Visual direction: ${globalVisualDirection.layout}; ${globalVisualDirection.background}; ${globalVisualDirection.cardStyle}; ${globalVisualDirection.motionStyle}.`,
    `Brand system: ${brief.brand.primary}, ${brief.brand.secondary}, ${brief.brand.accent}, ${brief.brand.surface}, ${brief.brand.text}; display font ${brief.brand.fontDisplay}; body font ${brief.brand.fontBody}; radius ${brief.brand.radius}; motion ${brief.brand.motion}.`,
    `Copy direction: ${copyDirection.headlineStyle}. Target ${brief.goals.join(", ")} without cloning the source references.`
  ].join(" ");

  const constraints = [
    "Do not copy source copy, logos, illustrations, or trademarked brand language.",
    "Use references as structural inspiration only, then restyle into the target brand system.",
    "When combining sections from multiple sources, smooth spacing, tone, and CTA language so the final page reads as one product."
  ];

  return {
    "project": {
      "projectName": brief.projectName,
      "industry": brief.industry,
      "siteType": brief.siteType
    },
    "selectedSections": selectedSections,
    "sectionRationale": sectionRationale,
    "globalVisualDirection": globalVisualDirection,
    "brandAdaptation": brandAdaptation,
    "copyDirection": copyDirection,
    "implementationPrompt": implementationPrompt,
    "constraints": constraints
  };
}
