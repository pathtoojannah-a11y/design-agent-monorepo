import { classifyComponent } from "./category-classifier.mjs";
import { generateIntegrationPrompt } from "./prompt-generator.mjs";

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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function detectAnimationLib(code) {
  if (!code) {
    return "none";
  }

  if (code.includes("motion/react") || code.includes("from \"motion\"") || code.includes("from 'motion'")) {
    return "motion/react";
  }

  if (code.includes("framer-motion")) {
    return "framer-motion";
  }

  if (code.includes("@keyframes") || code.includes("animation:") || code.includes("transition:")) {
    return "css";
  }

  return "none";
}

function extractAnimationConfigs(code) {
  if (!code) {
    return [];
  }

  const configs = [];
  const springPattern = /(?:spring|transition)\s*[:=]\s*\{([^}]+)\}/gi;

  for (const match of code.matchAll(springPattern)) {
    const block = match[1];
    const config = { type: "spring" };

    const damping = block.match(/damping\s*[:=]\s*(\d+)/);
    const stiffness = block.match(/stiffness\s*[:=]\s*(\d+)/);
    const duration = block.match(/duration\s*[:=]\s*([\d.]+)/);

    if (damping) {
      config.damping = Number(damping[1]);
    }

    if (stiffness) {
      config.stiffness = Number(stiffness[1]);
    }

    if (duration) {
      config.type = "tween";
      config.duration = Number(duration[1]);
    }

    if (Object.keys(config).length > 1) {
      configs.push(config);
    }
  }

  return configs;
}

function detectLayoutApproach(code) {
  if (!code) {
    return "unknown";
  }

  if (code.includes("grid-cols") || code.includes("display: grid") || code.includes("grid grid-")) {
    return "grid";
  }

  if (code.includes("flex ") || code.includes("flex-col") || code.includes("flex-row") || code.includes("display: flex")) {
    return "flex";
  }

  if (code.includes("absolute") || code.includes("fixed") || code.includes("position:")) {
    return "absolute";
  }

  return "unknown";
}

function extractResponsiveBreakpoints(code) {
  if (!code) {
    return [];
  }

  const breakpoints = new Set();
  const pattern = /\b(sm|md|lg|xl|2xl):/g;

  for (const match of code.matchAll(pattern)) {
    breakpoints.add(match[1]);
  }

  return [...breakpoints].sort();
}

function extractStateManagement(code) {
  if (!code) {
    return [];
  }

  const hooks = new Set();
  const pattern = /\b(useState|useRef|useEffect|useCallback|useMemo|useReducer|useContext|useId|useTransition)\b/g;

  for (const match of code.matchAll(pattern)) {
    hooks.add(match[1]);
  }

  return [...hooks].sort();
}

function extractInteractionPatterns(code) {
  if (!code) {
    return [];
  }

  const patterns = [];

  if (/onClick|onPress/i.test(code)) {
    patterns.push("click");
  }

  if (/onMouseEnter|onHover|whileHover/i.test(code)) {
    patterns.push("hover");
  }

  if (/onFocus|onBlur|focusWithin/i.test(code)) {
    patterns.push("focus");
  }

  if (/onScroll|useScroll|scrollY|IntersectionObserver/i.test(code)) {
    patterns.push("scroll");
  }

  if (/onKeyDown|onKeyUp|onKeyPress/i.test(code)) {
    patterns.push("keyboard");
  }

  if (/onDrag|useDrag|draggable/i.test(code)) {
    patterns.push("drag");
  }

  if (/useClickOutside|clickOutside|mousedown.*outside/i.test(code)) {
    patterns.push("click-outside");
  }

  if (/onResize|ResizeObserver/i.test(code)) {
    patterns.push("resize");
  }

  return patterns;
}

function extractTailwindPatterns(code) {
  if (!code) {
    return [];
  }

  const patterns = [];

  if (/bg-gradient|from-|via-|to-/.test(code)) {
    patterns.push("gradient");
  }

  if (/bg-clip-text|text-transparent/.test(code)) {
    patterns.push("gradient-text");
  }

  if (/backdrop-blur|bg-.*\/\d/.test(code)) {
    patterns.push("glassmorphism");
  }

  if (/shadow-/.test(code)) {
    patterns.push("shadow");
  }

  if (/rounded-/.test(code)) {
    patterns.push("rounded");
  }

  if (/animate-/.test(code)) {
    patterns.push("animate");
  }

  if (/dark:/.test(code)) {
    patterns.push("dark-mode");
  }

  if (/group\/|group-hover/.test(code)) {
    patterns.push("group-hover");
  }

  return patterns;
}

function generateAdaptationGuidance(scraped, classification) {
  const guidance = [];

  if (scraped.componentCode) {
    // Check for hardcoded colors
    if (/#[0-9a-fA-F]{3,8}|rgb\(|hsl\(/.test(scraped.componentCode)) {
      guidance.push("Replace hardcoded color values with project brand colors or CSS variables.");
    }

    // Check for gradient usage
    if (/from-|via-|to-|gradient/.test(scraped.componentCode)) {
      guidance.push("Replace gradient color stops with the client brand palette.");
    }

    // Check for icon library
    if (/hugeicons|lucide|heroicons|@radix-ui\/react-icons/.test(scraped.componentCode)) {
      guidance.push("Swap icon library imports to match the project's preferred icon set (Lucide, Heroicons, etc.).");
    }

    // Check for hardcoded text
    if (/"[A-Z][a-z].*[a-z]"/.test(scraped.componentCode) && classification.kind === "section") {
      guidance.push("Replace placeholder copy (headlines, descriptions, CTAs) with project-specific content.");
    }

    // Check for image placeholders
    if (/placeholder|unsplash|picsum|via\.placeholder/.test(scraped.componentCode)) {
      guidance.push("Replace placeholder images with project-specific assets.");
    }
  }

  if (scraped.npmPackages?.length > 3) {
    guidance.push("Review the dependency list and remove any packages not needed for the final implementation.");
  }

  if (classification.kind === "section") {
    guidance.push("Adapt spacing, hierarchy, and CTA language to match the final page narrative.");
  } else {
    guidance.push("This is a reusable UI component — retheme, resize, or reorder as needed without preserving the original branding.");
  }

  return guidance;
}

export function buildItemRecord(scraped, { creator, slug } = {}) {
  const classification = classifyComponent({
    slug: slug ?? scraped.slug,
    title: scraped.title,
    componentCode: scraped.componentCode,
    description: scraped.description
  });

  const componentName = toPascalCase(scraped.title ?? slug ?? "CollectedItem");
  const fileName = slugify(scraped.title ?? slug ?? "collected-item");
  const id = `${classification.category}:${scraped.url ?? `${creator}/${slug}`}`;

  const patterns = {
    animationLib: detectAnimationLib(scraped.componentCode),
    animationConfigs: extractAnimationConfigs(scraped.componentCode),
    layoutApproach: detectLayoutApproach(scraped.componentCode),
    responsiveBreakpoints: extractResponsiveBreakpoints(scraped.componentCode),
    stateManagement: extractStateManagement(scraped.componentCode),
    interactionPatterns: extractInteractionPatterns(scraped.componentCode),
    tailwindPatterns: extractTailwindPatterns(scraped.componentCode)
  };

  const adaptationGuidance = generateAdaptationGuidance(scraped, classification);

  const npmPackages = unique(scraped.npmPackages ?? []).sort();
  const installCommand = scraped.installCommand ??
    (npmPackages.length > 0 ? `npm install ${npmPackages.join(" ")}` : null);

  const dependencyFiles = (scraped.dependencyFiles ?? []).map((dep) => ({
    name: dep.name,
    source: dep.source ?? dep.content,
    path: dep.path ?? `/components/ui/${slugify(dep.name)}.tsx`
  }));

  const componentFiles = [];
  if (scraped.componentCode) {
    componentFiles.push({
      path: `/components/ui/${fileName}.tsx`,
      content: scraped.componentCode
    });
  }

  const integrationPrompt = scraped.componentCode
    ? generateIntegrationPrompt({
      componentName,
      componentCode: scraped.componentCode,
      demoCode: scraped.demoCode,
      dependencyFiles,
      npmPackages,
      shadcnDeps: scraped.shadcnDeps ?? [],
      installCommand,
      adaptationGuidance
    })
    : null;

  const hasCode = Boolean(scraped.componentCode);
  const collectionStatus = hasCode ? "recipe-complete" : "metadata-collected";

  const promptRecipe = {};
  if (integrationPrompt) {
    promptRecipe.sourcePrompt = integrationPrompt;
  }

  if (componentFiles.length > 0) {
    promptRecipe.componentFiles = componentFiles;
  }

  if (dependencyFiles.length > 0) {
    promptRecipe.dependencyFiles = dependencyFiles;
  }

  if (npmPackages.length > 0) {
    promptRecipe.installPackages = npmPackages;
  }

  if (installCommand) {
    promptRecipe.installCommand = installCommand;
  }

  if (scraped.demoCode) {
    promptRecipe.demoCode = scraped.demoCode;
  }

  if (adaptationGuidance.length > 0) {
    promptRecipe.adaptationGuidance = adaptationGuidance;
  }

  return {
    id,
    sourceUrl: scraped.url,
    sourceName: scraped.title ?? slug ?? "Unknown Component",
    sourceCategory: classification.category,
    categoryGroup: classification.group,
    itemKind: classification.kind,
    priority: classification.priority,
    sectionType: classification.kind === "section" ? classification.category.toLowerCase().replace(/\s+/g, "-") : "unknown",
    author: scraped.author ?? creator ?? null,
    license: scraped.license ?? null,
    description: scraped.description ?? "",
    previewUrl: scraped.previewImage ?? "",
    screenshot: scraped.previewImage ?? "",
    notes: `Collected from 21st.dev sitemap: ${scraped.url}`,
    lastSeenAt: new Date().toISOString(),
    collectionStatus,

    // Code intelligence
    componentCode: scraped.componentCode ?? null,
    demoCode: scraped.demoCode ?? null,
    patterns,
    adaptationGuidance,

    // Structured recipe (matches existing collector format)
    promptRecipe,
    code: {
      dependencies: npmPackages,
      exports: componentName ? [componentName] : [],
      supportFiles: unique(["@/lib/utils", ...(scraped.shadcnDeps ?? []).map((d) => `@/components/ui/${d}`)]),
      installCommand,
      demoUsage: scraped.demoCode ?? null,
      sourceSnippets: unique([
        scraped.componentCode,
        ...dependencyFiles.map((d) => d.source)
      ]),
      requiredAssets: []
    },
    normalizedRecipe: {
      targetStack: {
        framework: "react",
        language: "typescript",
        styling: "tailwindcss",
        structure: "shadcn"
      },
      compatibility: {
        shadcn: true,
        tailwindcss: true,
        typescript: true
      },
      componentName,
      demoComponentName: `${componentName}Demo`,
      destinationPaths: {
        component: `/components/ui/${fileName}.tsx`,
        demo: `/components/ui/${fileName}-demo.tsx`,
        styles: "/app/globals.css"
      },
      install: {
        packages: npmPackages,
        command: installCommand
      },
      supportFiles: unique(["@/lib/utils", ...(scraped.shadcnDeps ?? []).map((d) => `@/components/ui/${d}`)]),
      responsiveBehavior: patterns.responsiveBreakpoints.length > 0
        ? `Responsive at: ${patterns.responsiveBreakpoints.join(", ")} breakpoints`
        : "Adapt responsively to the surrounding layout while preserving the core visual hierarchy.",
      stateNotes: patterns.stateManagement.length > 0
        ? `Uses: ${patterns.stateManagement.join(", ")}`
        : "No special state management is required beyond local component state.",
      assetNotes: "Replace preview assets, copy, and branding with project-specific content before shipping.",
      usageExample: scraped.demoCode ?? null,
      adaptationNotes: adaptationGuidance
    },

    // Visual traits
    visualTraits: {
      layout: patterns.layoutApproach,
      background: "unknown",
      cardStyle: "unknown",
      motionStyle: patterns.animationLib !== "none" ? "animated" : "static"
    },

    industries: [],
    siteTypes: [],
    tone: [],
    strengths: [],
    requiresFeatureSignals: []
  };
}

export function buildItemRecords(scrapedComponents) {
  return scrapedComponents.map((scraped) =>
    buildItemRecord(scraped, { creator: scraped.creator, slug: scraped.slug })
  );
}
