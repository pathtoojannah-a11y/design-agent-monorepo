import fs from "node:fs";
import path from "node:path";
import { ensureDir, fileExists, loadJson, saveJson } from "../io.mjs";
import { getCachePaths, getDefaultCacheDir, getItemDetailPath } from "./cache-paths.mjs";

const COLLECTOR_VERSION = "0.2.0";
const DEFAULT_MAX_AGE_HOURS = 24;
const DEFAULT_TARGET_STACK = {
  framework: "react",
  language: "typescript",
  styling: "tailwindcss",
  structure: "shadcn"
};

function nowIso() {
  return new Date().toISOString();
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeUrl(url = "") {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return String(url).trim().replace(/\/$/, "");
  }
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "collected-item";
}

function toPascalCase(value) {
  return String(value ?? "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") || "CollectedItem";
}

function getDetailKey(entry) {
  return [
    normalizeText(entry.id),
    normalizeUrl(entry.sourceUrl),
    `${normalizeText(entry.sourceCategory)}:${normalizeText(entry.sourceName)}`
  ].find(Boolean);
}

function compareIso(a, b) {
  return Date.parse(a ?? 0) - Date.parse(b ?? 0);
}

function strongestPriority(a = "secondary", b = "secondary") {
  if (a === "core" || b === "core") {
    return "core";
  }

  return a || b || "secondary";
}

function guessDependencies(template, category) {
  const declared = unique([
    ...toArray(template.dependencies),
    ...toArray(template.packages)
  ]);

  if (declared.length > 0) {
    return declared.sort();
  }

  const categoryName = normalizeText(category.name);
  const itemText = normalizeText(
    [template.title, template.description, template.notes, template.sectionType].join(" ")
  );
  const dependencies = [];

  if (categoryName.includes("form") || itemText.includes("form")) {
    dependencies.push("react-hook-form");
  }

  if (itemText.includes("motion") || categoryName.includes("carousel")) {
    dependencies.push("framer-motion");
  }

  if (itemText.includes("3d") || itemText.includes("spline")) {
    dependencies.push("@splinetool/react-spline", "@splinetool/runtime");
  }

  return unique(dependencies).sort();
}

function buildInstallCommand(dependencies) {
  if (!dependencies.length) {
    return null;
  }

  return `npm install ${dependencies.join(" ")}`;
}

function buildDefaultSupportFiles(template) {
  return unique([
    "@/lib/utils",
    ...toArray(template.supportFiles)
  ]);
}

function buildDefaultUsageExample(componentName, fileName) {
  return [
    `import { ${componentName} } from "@/components/ui/${fileName}";`,
    "",
    `export function Example${componentName}() {`,
    `  return <${componentName} />;`,
    "}"
  ].join("\n");
}

function buildAdaptationNotes(category, template) {
  return unique([
    `Keep the ${category.name} structure, but replace source colors and typography with the project brand system.`,
    category.groupName === "UI Components"
      ? "Treat this as a reusable UI recipe that can be resized, reordered, or rethemed without preserving the original branding."
      : "Treat this as a section-level reference and adapt spacing, hierarchy, and CTA language to match the final page narrative.",
    template.notes ? `Reference note: ${template.notes}` : null
  ]);
}

function inferComponentName(template) {
  return template.componentName ?? toPascalCase(template.title ?? template.id ?? "Collected Item");
}

function inferDemoName(componentName, template) {
  return template.demoComponentName ?? `${componentName}Demo`;
}

function inferItemKind(category) {
  return category.groupName === "UI Components" ? "component" : "section";
}

function normalizeCategory(category, groupName, lastSeenAt) {
  return {
    groupName,
    name: category.name,
    count: category.count ?? (category.templates?.length ?? 0),
    mapsToSections: unique(category.mapsToSections ?? []),
    priority: category.priority ?? "secondary",
    lastSeenAt
  };
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
    itemKind: inferItemKind({ ...category, groupName }),
    lastSeenAt
  };
}

function normalizeItemDetail(template, category, groupName, lastSeenAt) {
  const normalizedTemplate = normalizeTemplate(template, category, groupName, lastSeenAt);
  const componentName = inferComponentName(template);
  const demoComponentName = inferDemoName(componentName, template);
  const fileName = slugify(template.fileName ?? template.title ?? template.id);
  const dependencies = guessDependencies(template, category);
  const installCommand = buildInstallCommand(dependencies);
  const supportFiles = buildDefaultSupportFiles(template);
  const targetPath = template.destinationPath ?? `/components/ui/${fileName}.tsx`;
  const demoPath = template.demoPath ?? `/components/ui/${fileName}-demo.tsx`;

  return {
    id: normalizedTemplate.id,
    sourceCategory: normalizedTemplate.sourceCategory,
    sourceUrl: normalizedTemplate.sourceUrl,
    sourceName: normalizedTemplate.sourceName,
    categoryGroup: normalizedTemplate.categoryGroup,
    itemKind: normalizedTemplate.itemKind,
    priority: normalizedTemplate.priority,
    sectionType: normalizedTemplate.sectionType,
    industries: normalizedTemplate.industries,
    siteTypes: normalizedTemplate.siteTypes,
    tone: normalizedTemplate.tone,
    strengths: normalizedTemplate.strengths,
    requiresFeatureSignals: normalizedTemplate.requiresFeatureSignals,
    notes: normalizedTemplate.notes,
    previewUrl: normalizedTemplate.previewUrl,
    screenshot: normalizedTemplate.screenshot,
    description: normalizedTemplate.description,
    visualTraits: normalizedTemplate.visualTraits,
    lastSeenAt,
    code: {
      dependencies,
      exports: unique([
        ...toArray(template.exports),
        componentName
      ]),
      supportFiles,
      installCommand,
      demoUsage: template.demoUsage ?? buildDefaultUsageExample(componentName, fileName),
      sourceSnippets: toArray(template.sourceSnippets),
      requiredAssets: toArray(template.requiredAssets)
    },
    normalizedRecipe: {
      targetStack: {
        ...DEFAULT_TARGET_STACK,
        ...(template.targetStack ?? {})
      },
      compatibility: {
        shadcn: true,
        tailwindcss: true,
        typescript: true,
        ...(template.compatibility ?? {})
      },
      componentName,
      demoComponentName,
      destinationPaths: {
        component: targetPath,
        demo: demoPath,
        styles: template.stylesPath ?? "/app/globals.css"
      },
      install: {
        packages: dependencies,
        command: installCommand
      },
      supportFiles,
      responsiveBehavior:
        template.responsiveBehavior ??
        "Adapt responsively to the surrounding layout while preserving the core visual hierarchy.",
      stateNotes:
        template.stateNotes ??
        "No special state management is required beyond local component state unless the host project adds dynamic data.",
      assetNotes:
        template.assetNotes ??
        "Replace preview assets, copy, and branding with project-specific content before shipping.",
      usageExample: template.usageExample ?? buildDefaultUsageExample(componentName, fileName),
      adaptationNotes: unique([
        ...buildAdaptationNotes({ ...category, groupName }, template),
        ...toArray(template.adaptationNotes)
      ])
    }
  };
}

function loadSessionExport(filePath) {
  return loadJson(path.resolve(process.cwd(), filePath));
}

function collectFromSessionExport(sessionExport) {
  const lastSeenAt = sessionExport.collectedAt ?? nowIso();
  const categories = [];
  const templates = [];
  const itemDetails = [];

  for (const group of sessionExport.groups ?? []) {
    for (const category of group.categories ?? []) {
      categories.push(normalizeCategory(category, group.name, lastSeenAt));

      for (const template of category.templates ?? []) {
        templates.push(normalizeTemplate(template, category, group.name, lastSeenAt));
        itemDetails.push(normalizeItemDetail(template, category, group.name, lastSeenAt));
      }
    }
  }

  return { categories, templates, itemDetails, lastSeenAt };
}

function readExistingItemDetails(cacheDir) {
  const cachePaths = getCachePaths(cacheDir);
  if (!fileExists(cachePaths.itemsDir)) {
    return [];
  }

  return fs.readdirSync(cachePaths.itemsDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => loadJson(path.resolve(cachePaths.itemsDir, fileName)));
}

function mergeCategories(existing, incoming) {
  const merged = new Map();

  for (const category of [...existing, ...incoming]) {
    const key = normalizeText(category.name);
    const current = merged.get(key);

    if (!current) {
      merged.set(key, { ...category });
      continue;
    }

    merged.set(key, {
      ...current,
      groupName: category.groupName || current.groupName,
      name: current.name || category.name,
      count: Math.max(current.count ?? 0, category.count ?? 0),
      mapsToSections: unique([
        ...(current.mapsToSections ?? []),
        ...(category.mapsToSections ?? [])
      ]),
      priority: strongestPriority(current.priority, category.priority),
      lastSeenAt: compareIso(current.lastSeenAt, category.lastSeenAt) >= 0
        ? current.lastSeenAt
        : category.lastSeenAt
    });
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function mergeDetails(existing, incoming) {
  const merged = new Map();

  for (const detail of [...existing, ...incoming]) {
    const key = getDetailKey(detail);
    const current = key ? merged.get(key) : null;

    if (!key) {
      continue;
    }

    if (!current) {
      merged.set(key, detail);
      continue;
    }

    const latest = compareIso(current.lastSeenAt, detail.lastSeenAt) >= 0 ? current : detail;
    const oldest = latest === current ? detail : current;

    merged.set(key, {
      ...oldest,
      ...latest,
      id: latest.id || oldest.id,
      previewUrl: latest.previewUrl || oldest.previewUrl,
      screenshot: latest.screenshot || oldest.screenshot,
      description: latest.description || oldest.description,
      visualTraits: {
        ...(oldest.visualTraits ?? {}),
        ...(latest.visualTraits ?? {})
      },
      code: {
        ...(oldest.code ?? {}),
        ...(latest.code ?? {}),
        dependencies: unique([
          ...toArray(oldest.code?.dependencies),
          ...toArray(latest.code?.dependencies)
        ]).sort(),
        exports: unique([
          ...toArray(oldest.code?.exports),
          ...toArray(latest.code?.exports)
        ]),
        supportFiles: unique([
          ...toArray(oldest.code?.supportFiles),
          ...toArray(latest.code?.supportFiles)
        ]),
        requiredAssets: unique([
          ...toArray(oldest.code?.requiredAssets),
          ...toArray(latest.code?.requiredAssets)
        ]),
        sourceSnippets: unique([
          ...toArray(oldest.code?.sourceSnippets),
          ...toArray(latest.code?.sourceSnippets)
        ])
      },
      normalizedRecipe: {
        ...(oldest.normalizedRecipe ?? {}),
        ...(latest.normalizedRecipe ?? {}),
        targetStack: {
          ...DEFAULT_TARGET_STACK,
          ...(oldest.normalizedRecipe?.targetStack ?? {}),
          ...(latest.normalizedRecipe?.targetStack ?? {})
        },
        compatibility: {
          shadcn: true,
          tailwindcss: true,
          typescript: true,
          ...(oldest.normalizedRecipe?.compatibility ?? {}),
          ...(latest.normalizedRecipe?.compatibility ?? {})
        },
        destinationPaths: {
          ...(oldest.normalizedRecipe?.destinationPaths ?? {}),
          ...(latest.normalizedRecipe?.destinationPaths ?? {})
        },
        install: {
          packages: unique([
            ...toArray(oldest.normalizedRecipe?.install?.packages),
            ...toArray(latest.normalizedRecipe?.install?.packages)
          ]).sort(),
          command:
            latest.normalizedRecipe?.install?.command ??
            oldest.normalizedRecipe?.install?.command ??
            buildInstallCommand(
              unique([
                ...toArray(oldest.normalizedRecipe?.install?.packages),
                ...toArray(latest.normalizedRecipe?.install?.packages)
              ]).sort()
            )
        },
        supportFiles: unique([
          ...toArray(oldest.normalizedRecipe?.supportFiles),
          ...toArray(latest.normalizedRecipe?.supportFiles)
        ]),
        adaptationNotes: unique([
          ...toArray(oldest.normalizedRecipe?.adaptationNotes),
          ...toArray(latest.normalizedRecipe?.adaptationNotes)
        ])
      },
      lastSeenAt: latest.lastSeenAt
    });
  }

  return [...merged.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function buildTemplateIndex(itemDetails) {
  return itemDetails.map((detail) => ({
    id: detail.id,
    sourceUrl: detail.sourceUrl,
    sourceName: detail.sourceName,
    categoryGroup: detail.categoryGroup,
    sourceCategory: detail.sourceCategory,
    priority: detail.priority ?? "secondary",
    sectionType: detail.sectionType ?? "unknown",
    industries: detail.industries ?? [],
    siteTypes: detail.siteTypes ?? [],
    tone: detail.tone ?? [],
    strengths: detail.strengths ?? [],
    requiresFeatureSignals: detail.requiresFeatureSignals ?? [],
    visualTraits: detail.visualTraits ?? {
      layout: "unknown",
      background: "unknown",
      cardStyle: "unknown",
      motionStyle: "unknown"
    },
    notes: detail.notes ?? detail.description ?? "Collected from 21st session data.",
    screenshot: detail.screenshot ?? detail.previewUrl ?? "",
    previewUrl: detail.previewUrl ?? "",
    description: detail.description ?? "",
    itemKind: detail.itemKind ?? "section",
    lastSeenAt: detail.lastSeenAt
  }));
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

function buildCoverageState({
  categories,
  itemDetails,
  baselineCategoryIndex,
  lastRefreshSeenCategories,
  refreshLastSeenAt,
  maxAgeHours = DEFAULT_MAX_AGE_HOURS
}) {
  const templateCountsByCategory = Object.fromEntries(
    categories
      .map((category) => [
        category.name,
        itemDetails.filter((detail) => detail.sourceCategory === category.name).length
      ])
      .sort((a, b) => a[0].localeCompare(b[0]))
  );
  const categoriesWithItems = Object.entries(templateCountsByCategory)
    .filter(([, count]) => count > 0)
    .map(([name]) => name);
  const categoriesMissingItems = Object.entries(templateCountsByCategory)
    .filter(([, count]) => count === 0)
    .map(([name]) => name);

  const lastSeenByCategory = Object.fromEntries(
    categories.map((category) => [category.name, category.lastSeenAt])
  );
  const staleCategories = categories
    .filter((category) => !lastRefreshSeenCategories.has(category.name))
    .map((category) => category.name);

  const ageMs = Date.now() - Date.parse(refreshLastSeenAt);
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const refreshIsStale = Number.isFinite(ageMs) && ageMs > maxAgeMs;

  let coverageStatus = "healthy";
  if (categoriesMissingItems.length > 0) {
    coverageStatus = "incomplete";
  } else if (refreshIsStale || staleCategories.length > 0) {
    coverageStatus = "stale";
  }

  return {
    collectorVersion: COLLECTOR_VERSION,
    lastFullRefreshAt: refreshLastSeenAt,
    categoriesScanned: categories.map((category) => category.name),
    categoriesWithItems,
    categoriesMissingItems,
    itemCountsByCategory: templateCountsByCategory,
    staleCategories,
    lastSeenByCategory,
    coverageStatus,
    failures: [],
    baselineDiff: buildBaselineDiff(categories, baselineCategoryIndex)
  };
}

function collectFromSources(sourceFiles) {
  const aggregated = {
    categories: [],
    templates: [],
    itemDetails: [],
    refreshSeenCategories: new Set(),
    lastSeenAt: nowIso()
  };

  for (const sourceFile of sourceFiles) {
    const sessionExport = loadSessionExport(sourceFile);
    const collected = collectFromSessionExport(sessionExport);
    aggregated.categories.push(...collected.categories);
    aggregated.templates.push(...collected.templates);
    aggregated.itemDetails.push(...collected.itemDetails);
    for (const category of collected.categories) {
      aggregated.refreshSeenCategories.add(category.name);
    }
    if (compareIso(aggregated.lastSeenAt, collected.lastSeenAt) < 0) {
      aggregated.lastSeenAt = collected.lastSeenAt;
    }
  }

  return aggregated;
}

function resolveSourceFiles({ sourceFile, sourceFiles = [], sourceDir }) {
  const resolvedFiles = unique([
    ...toArray(sourceFile),
    ...toArray(sourceFiles)
  ]);

  if (sourceDir) {
    const directory = path.resolve(process.cwd(), sourceDir);
    if (fileExists(directory)) {
      const fromDirectory = fs.readdirSync(directory)
        .filter((fileName) => fileName.endsWith(".json"))
        .map((fileName) => path.join(sourceDir, fileName));
      resolvedFiles.push(...fromDirectory);
    }
  }

  return unique(resolvedFiles);
}

function readExistingCategories(cacheDir) {
  const cachePaths = getCachePaths(cacheDir);
  return fileExists(cachePaths.categories) ? loadJson(cachePaths.categories) : [];
}

function readExistingTemplates(cacheDir) {
  const cachePaths = getCachePaths(cacheDir);
  return fileExists(cachePaths.templates) ? loadJson(cachePaths.templates) : [];
}

function writeItemDetails(cacheDir, itemDetails) {
  const cachePaths = getCachePaths(cacheDir);
  ensureDir(cachePaths.itemsDir);

  for (const detail of itemDetails) {
    saveJson(getItemDetailPath(cacheDir, detail.id), detail);
  }
}

export function collectTwentyFirstCache({
  sourceFile,
  sourceFiles = [],
  sourceDir,
  baselineCategoryIndex,
  cacheDir = getDefaultCacheDir(),
  maxAgeHours = DEFAULT_MAX_AGE_HOURS
}) {
  const resolvedSourceFiles = resolveSourceFiles({ sourceFile, sourceFiles, sourceDir });
  if (resolvedSourceFiles.length === 0) {
    throw new Error("No source files provided for 21st cache collection.");
  }

  const collected = collectFromSources(resolvedSourceFiles);
  const cachePaths = getCachePaths(cacheDir);
  const existingCategories = readExistingCategories(cacheDir);
  const existingItemDetails = readExistingItemDetails(cacheDir);
  const mergedCategories = mergeCategories(existingCategories, collected.categories);
  const mergedItemDetails = mergeDetails(existingItemDetails, collected.itemDetails);
  const mergedTemplates = buildTemplateIndex(mergedItemDetails);

  ensureDir(cacheDir);
  saveJson(cachePaths.categories, mergedCategories);
  saveJson(cachePaths.templates, mergedTemplates);
  writeItemDetails(cacheDir, mergedItemDetails);

  const collectionState = buildCoverageState({
    categories: mergedCategories,
    itemDetails: mergedItemDetails,
    baselineCategoryIndex,
    lastRefreshSeenCategories: collected.refreshSeenCategories,
    refreshLastSeenAt: collected.lastSeenAt,
    maxAgeHours
  });
  saveJson(cachePaths.collectionState, collectionState);

  return {
    cacheDir,
    sourceFiles: resolvedSourceFiles,
    categoriesWritten: mergedCategories.length,
    templatesWritten: mergedTemplates.length,
    itemDetailsWritten: mergedItemDetails.length,
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

export function readCacheHealth(cacheDir = getDefaultCacheDir(), maxAgeHours = DEFAULT_MAX_AGE_HOURS) {
  const currentState = readCollectionState(cacheDir);
  if (!currentState) {
    return {
      status: "missing",
      cacheDir,
      coverageStatus: "missing",
      categoriesMissingItems: [],
      staleCategories: [],
      needsRefresh: true
    };
  }

  const categories = readExistingCategories(cacheDir);
  const templates = readExistingTemplates(cacheDir);
  const derivedItemCountsByCategory = categories.length > 0
    ? Object.fromEntries(
      categories.map((category) => [
        category.name,
        templates.filter((template) => template.sourceCategory === category.name).length
      ])
    )
    : currentState.itemCountsByCategory ?? {};
  const derivedCategoriesWithItems = currentState.categoriesWithItems?.length
    ? currentState.categoriesWithItems
    : Object.entries(derivedItemCountsByCategory)
      .filter(([, count]) => count > 0)
      .map(([name]) => name);
  const derivedCategoriesMissingItems = currentState.categoriesMissingItems?.length || categories.length === 0
    ? currentState.categoriesMissingItems ?? []
    : Object.entries(derivedItemCountsByCategory)
      .filter(([, count]) => count === 0)
      .map(([name]) => name);
  const derivedLastSeenByCategory = Object.keys(currentState.lastSeenByCategory ?? {}).length > 0
    ? currentState.lastSeenByCategory
    : Object.fromEntries(categories.map((category) => [category.name, category.lastSeenAt]));
  const ageMs = Date.now() - Date.parse(currentState.lastFullRefreshAt);
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const ageIsStale = Number.isFinite(ageMs) && ageMs > maxAgeMs;
  const status = derivedCategoriesMissingItems.length > 0
    ? "incomplete"
    : currentState.coverageStatus === "stale" || ageIsStale
      ? "stale"
      : "healthy";

  return {
    status,
    cacheDir,
    coverageStatus: status,
    categoriesScanned: currentState.categoriesScanned ?? [],
    categoriesWithItems: derivedCategoriesWithItems,
    categoriesMissingItems: derivedCategoriesMissingItems,
    itemCountsByCategory: derivedItemCountsByCategory,
    staleCategories: unique([
      ...(currentState.staleCategories ?? []),
      ...(ageIsStale ? currentState.categoriesScanned ?? [] : [])
    ]),
    lastSeenByCategory: derivedLastSeenByCategory,
    needsRefresh: status !== "healthy"
  };
}

export function refreshTwentyFirstCache({
  sourceFile,
  sourceFiles = [],
  sourceDir,
  baselineCategoryIndex,
  cacheDir = getDefaultCacheDir(),
  staleAware = false,
  maxAgeHours = DEFAULT_MAX_AGE_HOURS
}) {
  const currentHealth = readCacheHealth(cacheDir, maxAgeHours);
  if (staleAware && currentHealth.status === "healthy") {
    return {
      cacheDir,
      reusedCache: true,
      collectionState: readCollectionState(cacheDir)
    };
  }

  return collectTwentyFirstCache({
    sourceFile,
    sourceFiles,
    sourceDir,
    baselineCategoryIndex,
    cacheDir,
    maxAgeHours
  });
}

export function inspectCollectedCategory({ cacheDir = getDefaultCacheDir(), categoryName }) {
  const categories = readExistingCategories(cacheDir);
  const templates = readExistingTemplates(cacheDir);
  const itemDetails = readExistingItemDetails(cacheDir);
  const category = categories.find((entry) => entry.name === categoryName) ?? null;
  const cacheHealth = readCacheHealth(cacheDir);
  const itemCount = cacheHealth.itemCountsByCategory?.[categoryName] ?? 0;

  return {
    category,
    coverage: {
      status: itemCount > 0 ? "covered" : "missing",
      itemCount,
      categoryMissingItems: cacheHealth.categoriesMissingItems?.includes(categoryName) ?? false,
      categoryStale: cacheHealth.staleCategories?.includes(categoryName) ?? false
    },
    templates: templates.filter((template) => template.sourceCategory === categoryName),
    itemDetails: itemDetails.filter((detail) => detail.sourceCategory === categoryName)
  };
}

export function inspectCollectedTemplate({ cacheDir = getDefaultCacheDir(), templateId }) {
  const templates = readExistingTemplates(cacheDir);
  const itemPath = getItemDetailPath(cacheDir, templateId);
  const template = templates.find((entry) => entry.id === templateId) ?? null;
  const itemDetail = fileExists(itemPath) ? loadJson(itemPath) : null;

  return {
    template,
    itemDetail
  };
}
