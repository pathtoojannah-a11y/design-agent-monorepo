function normalize(value) {
  return String(value).trim().toLowerCase();
}

function title(value) {
  return String(value)
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function getAllCategories(categoryIndex) {
  return categoryIndex.groups.flatMap((group) =>
    group.categories.map((category) => ({
      ...category,
      groupName: group.name
    }))
  );
}

function buildSectionCategoryMap(categoryIndex) {
  const map = new Map();

  for (const category of getAllCategories(categoryIndex)) {
    for (const section of category.mapsToSections ?? []) {
      const key = normalize(section);
      const next = map.get(key) ?? [];
      next.push(category.name);
      map.set(key, next);
    }
  }

  return map;
}

function addSignal(target, value) {
  if (value) {
    target.add(normalize(value));
  }
}

export function deriveFeatureSignals(brief) {
  const signals = new Set((brief.featureSignals ?? []).map(normalize));
  const text = normalize(
    [
      brief.projectName,
      brief.industry,
      brief.siteType,
      brief.targetAudience,
      ...(brief.goals ?? []),
      ...(brief.requiredSections ?? [])
    ].join(" ")
  );

  if (hasAny(text, ["form", "estimate", "contact", "signup", "sign up"])) {
    addSignal(signals, "forms");
  }

  if (hasAny(text, ["pricing", "plan", "subscription"])) {
    addSignal(signals, "pricing");
  }

  if (hasAny(text, ["compare", "comparison", "vs"])) {
    addSignal(signals, "comparison");
  }

  if (hasAny(text, ["review", "testimonial", "trust"])) {
    addSignal(signals, "testimonial-heavy");
  }

  if (hasAny(text, ["service area", "service areas", "local", "nearby"])) {
    addSignal(signals, "service-area");
  }

  if (hasAny(text, ["video", "demo", "walkthrough"])) {
    addSignal(signals, "video-led");
  }

  if (hasAny(text, ["portal", "dashboard", "workspace", "admin"])) {
    addSignal(signals, "dashboard");
  }

  if (hasAny(text, ["login", "log in", "sign in", "account", "member", "membership"])) {
    addSignal(signals, "auth");
  }

  return [...signals];
}

function mapSignalToCategories(signal) {
  const maps = {
    "forms": ["Forms", "Inputs", "Text Areas", "Selects"],
    "pricing": ["Pricing Sections", "Comparisons"],
    "comparison": ["Comparisons", "Tables", "Tabs"],
    "service-area": ["Maps", "Numbers"],
    "testimonial-heavy": ["Testimonials", "Clients", "Badges"],
    "video-led": ["Videos", "Carousels"],
    "dashboard": ["Sidebars", "Tables", "Tabs", "Notifications"],
    "auth": ["Sign Ins", "Sign ups", "Forms", "Inputs"]
  };

  return maps[signal] ?? [];
}

function buildClarificationQuestions(brief, signals, existingClarifications) {
  const questions = [];
  const text = normalize(
    [brief.siteType, brief.targetAudience, ...(brief.goals ?? []), ...(brief.requiredSections ?? [])].join(" ")
  );
  const authClarification = normalize(
    existingClarifications.auth ?? existingClarifications.dashboard ?? ""
  );
  const hasAuthClarification = authClarification.length > 0;
  const explicitMarketingOnly =
    (text.includes("marketing") ||
    text.includes("landing page") ||
    text.includes("lead generation")) &&
    !hasAny(text, ["portal", "dashboard", "workspace", "app", "membership"]);

  const mentionsAppSurface = hasAny(text, ["app", "platform", "portal", "workspace", "membership"]);
  const hasExplicitAuthSection = (brief.requiredSections ?? []).some((section) =>
    ["sign in", "signup", "sign up", "dashboard", "authentication"].includes(normalize(section))
  );

  if (
    !hasAuthClarification &&
    !explicitMarketingOnly &&
    !hasExplicitAuthSection &&
    (signals.includes("auth") || signals.includes("dashboard") || mentionsAppSurface)
  ) {
    questions.push({
      signal: "auth",
      question: "Do you need customer login or dashboard functionality, or is this purely a marketing site?",
      reason: "The brief hints at app or portal behavior, which could change which categories need to be inspected.",
      categoriesToUnlock: ["Sign Ins", "Sign ups", "Sidebars", "Tables", "Tabs", "Notifications"]
    });
  }

  return questions;
}

export function routeCategories({ brief, categoryIndex, availableCategories }) {
  const sectionMap = buildSectionCategoryMap(categoryIndex);
  const activeSignals = deriveFeatureSignals(brief);
  const clarifications = brief.clarifications ?? {};
  const authClarification = normalize(
    clarifications.auth ?? clarifications.dashboard ?? ""
  );
  const primary = new Set();
  const optional = new Set();
  const availableCategoryNames = new Set(
    (availableCategories ?? []).map((category) => normalize(category.name))
  );

  for (const section of brief.requiredSections ?? []) {
    const mapped = sectionMap.get(normalize(section)) ?? [];
    for (const category of mapped) {
      primary.add(category);
    }
  }

  for (const signal of activeSignals) {
    if (
      signal === "auth" &&
      authClarification === "marketing-only"
    ) {
      continue;
    }

    for (const category of mapSignalToCategories(signal)) {
      if (!primary.has(category)) {
        optional.add(category);
      }
    }
  }

  const availablePrimaryCategories = [...primary].filter((category) =>
    availableCategoryNames.has(normalize(category))
  );
  const availableOptionalCategories = [...optional].filter((category) =>
    availableCategoryNames.has(normalize(category))
  );

  const pendingQuestions = authClarification === "needs-auth"
    ? []
    : buildClarificationQuestions(brief, activeSignals, clarifications);

  return {
    activeSignals: activeSignals.map(title),
    primaryCategories: availablePrimaryCategories,
    optionalCategories: availableOptionalCategories,
    pendingQuestions
  };
}
