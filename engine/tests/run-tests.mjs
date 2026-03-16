import assert from "node:assert/strict";
import { composeBuildSpec } from "../src/compose.mjs";
import {
  collectTwentyFirstCache,
  inspectCollectedCategory,
  inspectCollectedTemplate,
  readCacheHealth,
  refreshTwentyFirstCache
} from "../src/collector/collector.mjs";
import { loadJson, removeDir, resolveFromRoot, saveJson } from "../src/io.mjs";

const references = loadJson(resolveFromRoot("catalog", "references.json"));
const categoryIndex = loadJson(resolveFromRoot("catalog", "category-index.json"));
const collectorFixture = resolveFromRoot("examples", "runtime", "twentyfirst-session-export.json");
const cacheDir = resolveFromRoot(".test-output", "21st-cache");
const mergeFixtureDir = resolveFromRoot(".test-output", "fixture-sources");
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

removeDir(cacheDir);
removeDir(mergeFixtureDir);

const collectionResult = collectTwentyFirstCache({
  sourceFile: collectorFixture,
  baselineCategoryIndex: categoryIndex,
  cacheDir
});
assert.equal(collectionResult.categoriesWritten, 59);
assert.ok(collectionResult.templatesWritten >= 6);
assert.equal(collectionResult.collectionState.baselineDiff.missingFromCollection.length, 0);
assert.equal(collectionResult.collectionState.coverageStatus, "incomplete");
assert.ok(collectionResult.collectionState.categoriesMissingItems.length > 0);

const heroesCategory = inspectCollectedCategory({
  cacheDir,
  categoryName: "Heroes"
});
assert.equal(heroesCategory.category.name, "Heroes");
assert.ok(heroesCategory.templates.some((template) => template.id === "hero-editorial"));
assert.equal(heroesCategory.coverage.status, "covered");

const heroTemplate = inspectCollectedTemplate({
  cacheDir,
  templateId: "hero-editorial"
});
assert.equal(heroTemplate.template.sourceCategory, "Heroes");
assert.equal(heroTemplate.itemDetail.normalizedRecipe.targetStack.framework, "react");
assert.equal(heroTemplate.itemDetail.normalizedRecipe.destinationPaths.component, "/components/ui/editorial-hero.tsx");
assert.equal(heroTemplate.itemDetail.normalizedRecipe.compatibility.shadcn, true);
assert.ok(Array.isArray(heroTemplate.itemDetail.normalizedRecipe.adaptationNotes));

const coverage = readCacheHealth(cacheDir);
assert.equal(coverage.status, "incomplete");
assert.ok(coverage.categoriesMissingItems.includes("Announcements"));

const cachedRefresh = refreshTwentyFirstCache({
  sourceFile: collectorFixture,
  baselineCategoryIndex: categoryIndex,
  cacheDir,
  staleAware: true,
  maxAgeHours: 999
});
assert.equal(cachedRefresh.reusedCache, undefined);

const cacheProviderSpec = composeBuildSpec(
  saasBrief,
  references,
  categoryIndex,
  {
    providerKind: "21st-cache",
    cacheDir
  }
);
assert.ok(
  cacheProviderSpec.selectedSections.some((section) => section.referenceId === "hero-editorial")
);
assert.equal(cacheProviderSpec.cacheHealth.status, "incomplete");
assert.ok(cacheProviderSpec.warnings.some((warning) => warning.includes("21st cache coverage is incomplete")));
assert.ok(cacheProviderSpec.componentRecipes.some((recipe) => recipe.id === "hero-editorial"));

const completeFixtureA = {
  collectedAt: "2026-03-16T10:00:00.000Z",
  groups: [
    {
      name: "Marketing Blocks",
      categories: [
        {
          name: "Heroes",
          count: 73,
          priority: "core",
          mapsToSections: ["hero"],
          templates: [
            {
              id: "hero-editorial",
              title: "Editorial Hero",
              url: "https://21st.dev/heroes/editorial-hero",
              previewUrl: "https://21st.dev/assets/editorial-hero.png",
              sectionType: "hero",
              notes: "Hero reference."
            }
          ]
        },
        {
          name: "Announcements",
          count: 10,
          priority: "secondary",
          mapsToSections: ["announcement"],
          templates: [
            {
              id: "announcement-banner",
              title: "Announcement Banner",
              url: "https://21st.dev/announcements/banner",
              previewUrl: "https://21st.dev/assets/announcement-banner.png",
              sectionType: "announcement",
              notes: "Announcement reference."
            }
          ]
        }
      ]
    }
  ]
};

const completeFixtureB = {
  collectedAt: "2026-03-16T11:00:00.000Z",
  groups: [
    {
      name: "Marketing Blocks",
      categories: categoryIndex.groups[0].categories
        .filter((category) => !["Heroes", "Announcements"].includes(category.name))
        .map((category) => ({
          name: category.name,
          count: category.count,
          priority: category.priority,
          mapsToSections: category.mapsToSections,
          templates: [
            {
              id: `${category.name}-template`,
              title: `${category.name} Template`,
              url: `https://21st.dev/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/template`,
              previewUrl: `https://21st.dev/assets/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`,
              sectionType: category.mapsToSections?.[0] ?? "unknown",
              notes: `${category.name} reference.`
            }
          ]
        }))
    },
    {
      name: "UI Components",
      categories: categoryIndex.groups[1].categories.map((category) => ({
        name: category.name,
        count: category.count,
        priority: category.priority,
        mapsToSections: category.mapsToSections,
        templates: [
          {
            id: `${category.name}-component`,
            title: `${category.name} Component`,
            url: `https://21st.dev/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/component`,
            previewUrl: `https://21st.dev/assets/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`,
            sectionType: category.mapsToSections?.[0] ?? "unknown",
            notes: `${category.name} component.`,
            dependencies: category.name === "Forms" ? ["react-hook-form"] : []
          }
        ]
      }))
    }
  ]
};

saveJson(resolveFromRoot(".test-output", "fixture-sources", "part-a.json"), completeFixtureA);
saveJson(resolveFromRoot(".test-output", "fixture-sources", "part-b.json"), completeFixtureB);

removeDir(cacheDir);

const mergedCoverageResult = collectTwentyFirstCache({
  sourceFiles: [
    resolveFromRoot(".test-output", "fixture-sources", "part-a.json"),
    resolveFromRoot(".test-output", "fixture-sources", "part-b.json")
  ],
  baselineCategoryIndex: categoryIndex,
  cacheDir
});

assert.equal(mergedCoverageResult.collectionState.coverageStatus, "healthy");
assert.equal(mergedCoverageResult.collectionState.categoriesMissingItems.length, 0);

const healthyCachedRefresh = refreshTwentyFirstCache({
  sourceFiles: [
    resolveFromRoot(".test-output", "fixture-sources", "part-a.json"),
    resolveFromRoot(".test-output", "fixture-sources", "part-b.json")
  ],
  baselineCategoryIndex: categoryIndex,
  cacheDir,
  staleAware: true,
  maxAgeHours: 999
});

assert.equal(healthyCachedRefresh.reusedCache, true);

const partialFollowup = {
  collectedAt: "2026-03-16T12:00:00.000Z",
  groups: [
    {
      name: "Marketing Blocks",
      categories: [
        {
          name: "Heroes",
          count: 73,
          priority: "core",
          mapsToSections: ["hero"],
          templates: []
        }
      ]
    }
  ]
};

saveJson(resolveFromRoot(".test-output", "fixture-sources", "partial.json"), partialFollowup);

const partialRefresh = collectTwentyFirstCache({
  sourceFile: resolveFromRoot(".test-output", "fixture-sources", "partial.json"),
  baselineCategoryIndex: categoryIndex,
  cacheDir
});

assert.equal(partialRefresh.collectionState.coverageStatus, "stale");
assert.equal(partialRefresh.collectionState.itemCountsByCategory.Heroes > 0, true);
assert.ok(partialRefresh.collectionState.staleCategories.includes("Announcements"));

removeDir(cacheDir);
removeDir(mergeFixtureDir);

console.log("All tests passed.");
