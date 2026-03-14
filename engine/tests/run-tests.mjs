import assert from "node:assert/strict";
import { composeBuildSpec } from "../src/compose.mjs";
import { loadJson, resolveFromRoot } from "../src/io.mjs";

const references = loadJson(resolveFromRoot("catalog", "references.json"));
const contractorBrief = loadJson(
  resolveFromRoot("examples", "briefs", "contractor-roofing.json")
);
const saasBrief = loadJson(
  resolveFromRoot("examples", "briefs", "saas-ai-platform.json")
);

const contractorSpec = composeBuildSpec(contractorBrief, references);
const saasSpec = composeBuildSpec(saasBrief, references);

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

const missingOptionalSpec = composeBuildSpec(
  {
    ...saasBrief,
    requiredSections: ["hero", "logos", "comparison", "pricing"]
  },
  references
);

assert.ok(
  missingOptionalSpec.selectedSections.some((section) => section.sectionType === "hero")
);
assert.ok(
  !missingOptionalSpec.selectedSections.some(
    (section) => section.sectionType === "comparison"
  )
);

console.log("All tests passed.");
