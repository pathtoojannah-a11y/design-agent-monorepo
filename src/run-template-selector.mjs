import fs from "node:fs";
import path from "node:path";

const briefPathArg = process.argv[2];

if (!briefPathArg) {
  console.error("Usage: node ./src/run-template-selector.mjs <brief.json>");
  process.exit(1);
}

const rootDir = process.cwd();
const briefPath = path.resolve(rootDir, briefPathArg);
const catalogPath = path.resolve(rootDir, "data", "template-catalog.json");

const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

function normalizeList(values = []) {
  return values.map((value) => String(value).trim().toLowerCase());
}

function hasOverlap(left = [], right = []) {
  const rightSet = new Set(normalizeList(right));
  return normalizeList(left).filter((item) => rightSet.has(item));
}

function scoreTemplate(template, currentBrief) {
  let score = 0;
  const reasons = [];

  const industryHits = hasOverlap(
    template.fit.industries,
    [currentBrief.industry]
  );
  if (industryHits.length > 0) {
    score += 30;
    reasons.push(`Industry fit: ${industryHits.join(", ")}`);
  }

  const typeHits = hasOverlap(
    template.fit.siteTypes,
    [currentBrief.siteType]
  );
  if (typeHits.length > 0) {
    score += 20;
    reasons.push(`Site type fit: ${typeHits.join(", ")}`);
  }

  const toneHits = hasOverlap(template.tone, currentBrief.tone);
  if (toneHits.length > 0) {
    score += toneHits.length * 8;
    reasons.push(`Tone overlap: ${toneHits.join(", ")}`);
  }

  const goalHits = hasOverlap(template.strengths, currentBrief.goals);
  if (goalHits.length > 0) {
    score += goalHits.length * 12;
    reasons.push(`Goal alignment: ${goalHits.join(", ")}`);
  }

  const sectionHits = hasOverlap(
    template.sections,
    currentBrief.requiredSections
  );
  if (sectionHits.length > 0) {
    score += sectionHits.length * 4;
    reasons.push(
      `Section coverage: ${sectionHits.length}/${currentBrief.requiredSections.length}`
    );
  }

  return {
    ...template,
    score,
    reasons
  };
}

function deriveBrandSystem(currentBrief, selectedTemplate) {
  const brand = currentBrief.brand;

  return {
    palette: {
      primary: brand.primary,
      secondary: brand.secondary,
      accent: brand.accent,
      surface: brand.surface,
      text: brand.text
    },
    typography: {
      display: brand.fontDisplay,
      body: brand.fontBody
    },
    ui: {
      radius: brand.radius,
      motion: brand.motion
    },
    adaptationNotes: [
      `Keep the base structure of "${selectedTemplate.name}" but replace all stock color relationships with the custom brand palette.`,
      `Use ${brand.fontDisplay} for high-emphasis headings and ${brand.fontBody} for body copy and UI labels.`,
      `Match motion to a ${brand.motion} rhythm so the final site feels branded rather than cloned.`,
      `Translate the "${selectedTemplate.visualPattern.layout}" layout into a version that prioritizes ${currentBrief.goals.join(", ")}.`
    ]
  };
}

function buildExecutionPlan(currentBrief, selectedTemplate, brandSystem) {
  return {
    chosenTemplate: {
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      score: selectedTemplate.score,
      reasons: selectedTemplate.reasons
    },
    recommendedSections: selectedTemplate.sections,
    visualDirection: selectedTemplate.visualPattern,
    brandSystem,
    agentWorkflow: [
      "Scout 5 candidate references that match the chosen template's structure.",
      "Reject any reference that conflicts with the project's industry, conversion goals, or required sections.",
      "Use the highest-scoring structure as the page skeleton only, not as final branding.",
      "Rewrite all tokens, typography, imagery direction, and CTA copy to match the current brief.",
      "Generate implementation-ready sections in the target stack after the design system is locked."
    ],
    promptSeed: `Select a landing-page direction for ${currentBrief.projectName}. Favor ${selectedTemplate.name} patterns, but restyle everything into a ${currentBrief.tone.join(
      ", "
    )} brand system using ${brandSystem.typography.display} and ${brandSystem.typography.body}. Optimize for ${currentBrief.goals.join(
      ", "
    )}.`
  };
}

const rankedTemplates = catalog
  .map((template) => scoreTemplate(template, brief))
  .sort((left, right) => right.score - left.score);

const selectedTemplate = rankedTemplates[0];
const brandSystem = deriveBrandSystem(brief, selectedTemplate);
const plan = buildExecutionPlan(brief, selectedTemplate, brandSystem);

console.log(JSON.stringify({
  brief,
  topMatches: rankedTemplates.slice(0, 3).map((template) => ({
    id: template.id,
    name: template.name,
    score: template.score,
    reasons: template.reasons
  })),
  plan
}, null, 2));
