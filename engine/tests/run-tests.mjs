import assert from "node:assert/strict";
import { composeBuildSpec } from "../src/compose.mjs";
import { loadJson, resolveFromRoot } from "../src/io.mjs";

const references = loadJson(resolveFromRoot("catalog", "references.json"));
const categoryIndex = loadJson(resolveFromRoot("catalog", "category-index.json"));
const contractorBrief = loadJson(
  resolveFromRoot("examples", "briefs", "contractor-roofing.json")
);
const saasBrief = loadJson(
  resolveFromRoot("examples", "briefs", "saas-ai-platform.json")
);

const contractorSpec = composeBuildSpec(contractorBrief, references, categoryIndex);
const saasSpec = composeBuildSpec(saasBrief, references, categoryIndex);

assert.equal(contractorSpec.status, undefined);
assert.ok(contractorSpec.selectedSections.length >= 6);
assert.ok(
  contractorSpec.selectedSections.some(
    (section) => section.sectionType === "testimonials"
  )
);
assert.ok(
  contractorSpec.selectedSections.every((section) =>
    section.referenceId.startsWith("ref-roofing-")
  )
);

assert.equal(saasSpec.project.industry, "ai");
assert.ok(
  saasSpec.selectedSections.some((section) => section.sectionType === "pricing")
);
assert.ok(
  saasSpec.selectedSections.some((section) => section.sectionType === "features")
);
assert.ok(
  saasSpec.selectedSections.every((section) =>
    section.referenceId.startsWith("ref-saas-")
  )
);

assert.equal(
  contractorSpec.brandAdaptation.typography.display,
  contractorBrief.brand.fontDisplay
);
assert.ok(contractorSpec.primaryCategories.includes("Heroes"));
assert.ok(!contractorSpec.questionsAsked.some((question) => question.signal === "auth"));

const missingOptionalSpec = composeBuildSpec(
  {
    ...saasBrief,
    requiredSections: ["hero", "logos", "comparison", "pricing"]
  },
  references,
  categoryIndex
);

assert.ok(
  missingOptionalSpec.selectedSections.some((section) => section.sectionType === "hero")
);
assert.ok(
  !missingOptionalSpec.selectedSections.some(
    (section) => section.sectionType === "comparison"
  )
);
assert.equal(missingOptionalSpec.confidenceSummary.level, "medium");

const ambiguousPortalSpec = composeBuildSpec(
  {
    ...saasBrief,
    "siteType": "customer portal platform",
    "targetAudience": "operations teams evaluating a portal and dashboard platform",
    "requiredSections": ["hero", "features", "pricing"]
  },
  references,
  categoryIndex
);

assert.equal(ambiguousPortalSpec.status, "needs_clarification");
assert.ok(
  ambiguousPortalSpec.questionsAsked.some((question) => question.signal === "auth")
);
assert.equal(ambiguousPortalSpec.confidenceSummary.level, "low");
assert.ok(ambiguousPortalSpec.pendingQuestion.categoriesToUnlock.includes("Sign Ins"));

const clarifiedPortalSpec = composeBuildSpec(
  {
    ...saasBrief,
    "siteType": "customer portal platform",
    "targetAudience": "operations teams evaluating a portal and dashboard platform",
    "requiredSections": ["hero", "features", "pricing"],
    "clarifications": {
      "auth": "marketing-only"
    }
  },
  references,
  categoryIndex
);

assert.equal(clarifiedPortalSpec.status, undefined);
assert.ok(
  !clarifiedPortalSpec.questionsAsked.some((question) => question.signal === "auth")
);

const manualRuntimeSpec = composeBuildSpec(
  saasBrief,
  references,
  categoryIndex,
  {
    providerKind: "manual-runtime",
    runtimeData: loadJson(
      resolveFromRoot("examples", "runtime", "manual-runtime.json")
    )
  }
);

assert.equal(manualRuntimeSpec.selectedSections[0].referenceId, "manual-hero");
assert.equal(manualRuntimeSpec.primaryCategories.includes("Heroes"), true);

console.log("All tests passed.");
