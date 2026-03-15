import path from "node:path";
import { ensureDir, fileExists, loadJson, saveJson } from "../io.mjs";
import { getCachePaths, getDefaultCacheDir } from "./cache-paths.mjs";

const COLLECTOR_VERSION = "0.1.0";

function nowIso() {
  return new Date().toISOString();
}

function normalizeTemplate(template, category, groupName, lastSeenAt) {
  return {
    id: template.id ?? `${category.name}:${template.url ?? template.title}`,
    sourceUrl: template.url ?? "",
    sourceName: template.title ?? "Untitled Template",
    categoryGroup: groupName,
    sourceCategory: category.name,
    priority: template.priority ?? category.priority ?? "secondary",
    sectionType: template.sectionType ?? "unknown",
    industries: template.industries ?? [],
    siteTypes: template.siteTypes ?? [],
    tone: template.tone ?? [],
    strengths: template.strengths ?? [],
    requiresFeatureSignals: template.requiresFeatureSignals ?? [],
    visualTraits: {
      layout: template.visualTraits?.layout ?? "unknown",
      background: template.visualTraits?.background ?? "unknown",
      cardStyle: template.visualTraits?.cardStyle ?? "unknown",
      motionStyle: template.visualTraits?.motionStyle ?? "unknown"
    },
    notes: template.notes ?? "Collected from 21st session data.",
    screenshot: template.previewUrl ?? template.screenshot ?? "",
    previewUrl: template.previewUrl ?? "",
    description: template.description ?? "",
    lastSeenAt
  };
}

function normalizeCategory(category, groupName, lastSeenAt) {
  return {
    groupName,
    name: category.name,
    count: category.count ?? (category.templates?.length ?? 0),
    mapsToSections: category.mapsToSections ?? [],
    priority: category.priority ?? "secondary",
    lastSeenAt
  };
}

function collectFromSessionExport(sessionExport) {
  const lastSeenAt = sessionExport.collectedAt ?? nowIso();
  const categories = [];
  const templates = [];

  for (const group of sessionExport.groups ?? []) {
    for (const category of group.categories ?? []) {
      categories.push(normalizeCategory(category, group.name, lastSeenAt));

      for (const template of category.templates ?? []) {
        templates.push(normalizeTemplate(template, category, group.name, lastSeenAt));
      }
    }
  }

  return { categories, templates, lastSeenAt };
}

function buildBaselineDiff(categories, baselineCategoryIndex) {
  const baselineNames = new Set(
    baselineCategoryIndex.groups.flatMap((group) => group.categories.map((category) => category.name))
  );
  const collectedNames = new Set(categories.map((category) => category.name));

  return {
    missingFromCollection: [...baselineNames].filter((name) => !collectedNames.has(name)),
    newFromCollection: [...collectedNames].filter((name) => !baselineNames.has(name))
  };
}

export function collectTwentyFirstCache({
  sourceFile,
  baselineCategoryIndex,
  cacheDir = getDefaultCacheDir()
}) {
  const sessionExport = loadJson(path.resolve(process.cwd(), sourceFile));
  const { categories, templates, lastSeenAt } = collectFromSessionExport(sessionExport);
  const cachePaths = getCachePaths(cacheDir);

  ensureDir(cacheDir);
  saveJson(cachePaths.categories, categories);
  saveJson(cachePaths.templates, templates);

  const collectionState = {
    collectorVersion: COLLECTOR_VERSION,
    lastFullRefreshAt: lastSeenAt,
    categoriesScanned: categories.map((category) => category.name),
    failures: [],
    baselineDiff: buildBaselineDiff(categories, baselineCategoryIndex)
  };
  saveJson(cachePaths.collectionState, collectionState);

  return {
    cacheDir,
    categoriesWritten: categories.length,
    templatesWritten: templates.length,
    collectionState
  };
}

export function readCollectionState(cacheDir = getDefaultCacheDir()) {
  const cachePaths = getCachePaths(cacheDir);
  if (!fileExists(cachePaths.collectionState)) {
    return null;
  }

  return loadJson(cachePaths.collectionState);
}

export function refreshTwentyFirstCache({
  sourceFile,
  baselineCategoryIndex,
  cacheDir = getDefaultCacheDir(),
  staleAware = false,
  maxAgeHours = 24
}) {
  const currentState = readCollectionState(cacheDir);
  if (staleAware && currentState?.lastFullRefreshAt) {
    const ageMs = Date.now() - Date.parse(currentState.lastFullRefreshAt);
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    if (ageMs <= maxAgeMs) {
      return {
        cacheDir,
        reusedCache: true,
        collectionState: currentState
      };
    }
  }

  return collectTwentyFirstCache({
    sourceFile,
    baselineCategoryIndex,
    cacheDir
  });
}

export function inspectCollectedCategory({ cacheDir = getDefaultCacheDir(), categoryName }) {
  const cachePaths = getCachePaths(cacheDir);
  const categories = fileExists(cachePaths.categories) ? loadJson(cachePaths.categories) : [];
  const templates = fileExists(cachePaths.templates) ? loadJson(cachePaths.templates) : [];
  const category = categories.find((entry) => entry.name === categoryName) ?? null;

  return {
    category,
    templates: templates.filter((template) => template.sourceCategory === categoryName)
  };
}

export function inspectCollectedTemplate({ cacheDir = getDefaultCacheDir(), templateId }) {
  const cachePaths = getCachePaths(cacheDir);
  const templates = fileExists(cachePaths.templates) ? loadJson(cachePaths.templates) : [];
  return templates.find((template) => template.id === templateId) ?? null;
}
