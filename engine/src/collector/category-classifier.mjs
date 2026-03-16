const KEYWORD_MAP = {
  // Marketing Blocks
  "hero": { category: "Heroes", group: "Marketing Blocks", kind: "section", priority: "core" },
  "pricing": { category: "Pricing Sections", group: "Marketing Blocks", kind: "section", priority: "core" },
  "feature": { category: "Features", group: "Marketing Blocks", kind: "section", priority: "core" },
  "testimonial": { category: "Testimonials", group: "Marketing Blocks", kind: "section", priority: "core" },
  "review": { category: "Testimonials", group: "Marketing Blocks", kind: "section", priority: "core" },
  "cta": { category: "Calls to Action", group: "Marketing Blocks", kind: "section", priority: "core" },
  "call-to-action": { category: "Calls to Action", group: "Marketing Blocks", kind: "section", priority: "core" },
  "footer": { category: "Footers", group: "Marketing Blocks", kind: "section", priority: "core" },
  "nav": { category: "Navigation Menus", group: "Marketing Blocks", kind: "section", priority: "core" },
  "navbar": { category: "Navigation Menus", group: "Marketing Blocks", kind: "section", priority: "core" },
  "navigation": { category: "Navigation Menus", group: "Marketing Blocks", kind: "section", priority: "core" },
  "menu": { category: "Navigation Menus", group: "Marketing Blocks", kind: "section", priority: "core" },
  "header": { category: "Navigation Menus", group: "Marketing Blocks", kind: "section", priority: "core" },
  "announcement": { category: "Announcements", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "banner": { category: "Announcements", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "background": { category: "Backgrounds", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "border": { category: "Borders", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "divider": { category: "Borders", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "client": { category: "Clients", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "logo": { category: "Clients", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "partner": { category: "Clients", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "comparison": { category: "Comparisons", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "vs": { category: "Comparisons", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "doc": { category: "Docs", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "documentation": { category: "Docs", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "image": { category: "Images", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "gallery": { category: "Images", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "photo": { category: "Images", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "map": { category: "Maps", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "scroll": { category: "Scroll Areas", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "shader": { category: "Shaders", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "particle": { category: "Shaders", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "gradient-bg": { category: "Shaders", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "text": { category: "Texts", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "typography": { category: "Texts", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "heading": { category: "Texts", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "video": { category: "Videos", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "hook": { category: "Hooks", group: "Marketing Blocks", kind: "section", priority: "secondary" },
  "use-": { category: "Hooks", group: "Marketing Blocks", kind: "section", priority: "secondary" },

  // UI Components
  "accordion": { category: "Accordions", group: "UI Components", kind: "component", priority: "secondary" },
  "ai-chat": { category: "AI Chats", group: "UI Components", kind: "component", priority: "secondary" },
  "chat": { category: "AI Chats", group: "UI Components", kind: "component", priority: "secondary" },
  "alert": { category: "Alerts", group: "UI Components", kind: "component", priority: "secondary" },
  "avatar": { category: "Avatars", group: "UI Components", kind: "component", priority: "secondary" },
  "badge": { category: "Badges", group: "UI Components", kind: "component", priority: "secondary" },
  "button": { category: "Buttons", group: "UI Components", kind: "component", priority: "secondary" },
  "btn": { category: "Buttons", group: "UI Components", kind: "component", priority: "secondary" },
  "calendar": { category: "Calendars", group: "UI Components", kind: "component", priority: "secondary" },
  "date-picker": { category: "Date Pickers", group: "UI Components", kind: "component", priority: "secondary" },
  "datepicker": { category: "Date Pickers", group: "UI Components", kind: "component", priority: "secondary" },
  "card": { category: "Cards", group: "UI Components", kind: "component", priority: "secondary" },
  "carousel": { category: "Carousels", group: "UI Components", kind: "component", priority: "secondary" },
  "slider": { category: "Sliders", group: "UI Components", kind: "component", priority: "secondary" },
  "checkbox": { category: "Checkboxes", group: "UI Components", kind: "component", priority: "secondary" },
  "dialog": { category: "Dialogs / Modals", group: "UI Components", kind: "component", priority: "secondary" },
  "modal": { category: "Dialogs / Modals", group: "UI Components", kind: "component", priority: "secondary" },
  "dropdown": { category: "Dropdowns", group: "UI Components", kind: "component", priority: "secondary" },
  "empty-state": { category: "Empty States", group: "UI Components", kind: "component", priority: "secondary" },
  "file-tree": { category: "File Trees", group: "UI Components", kind: "component", priority: "secondary" },
  "file-upload": { category: "File Uploads", group: "UI Components", kind: "component", priority: "secondary" },
  "upload": { category: "File Uploads", group: "UI Components", kind: "component", priority: "secondary" },
  "form": { category: "Forms", group: "UI Components", kind: "component", priority: "secondary" },
  "icon": { category: "Icons", group: "UI Components", kind: "component", priority: "secondary" },
  "input": { category: "Inputs", group: "UI Components", kind: "component", priority: "secondary" },
  "link": { category: "Links", group: "UI Components", kind: "component", priority: "secondary" },
  "notification": { category: "Notifications", group: "UI Components", kind: "component", priority: "secondary" },
  "number": { category: "Numbers", group: "UI Components", kind: "component", priority: "secondary" },
  "counter": { category: "Numbers", group: "UI Components", kind: "component", priority: "secondary" },
  "stat": { category: "Numbers", group: "UI Components", kind: "component", priority: "secondary" },
  "pagination": { category: "Paginations", group: "UI Components", kind: "component", priority: "secondary" },
  "popover": { category: "Popovers", group: "UI Components", kind: "component", priority: "secondary" },
  "radio": { category: "Radio Groups", group: "UI Components", kind: "component", priority: "secondary" },
  "select": { category: "Selects", group: "UI Components", kind: "component", priority: "secondary" },
  "sidebar": { category: "Sidebars", group: "UI Components", kind: "component", priority: "secondary" },
  "sign-in": { category: "Sign Ins", group: "UI Components", kind: "component", priority: "secondary" },
  "login": { category: "Sign Ins", group: "UI Components", kind: "component", priority: "secondary" },
  "signin": { category: "Sign Ins", group: "UI Components", kind: "component", priority: "secondary" },
  "sign-up": { category: "Sign ups", group: "UI Components", kind: "component", priority: "secondary" },
  "signup": { category: "Sign ups", group: "UI Components", kind: "component", priority: "secondary" },
  "register": { category: "Sign ups", group: "UI Components", kind: "component", priority: "secondary" },
  "spinner": { category: "Spinner Loaders", group: "UI Components", kind: "component", priority: "secondary" },
  "loader": { category: "Spinner Loaders", group: "UI Components", kind: "component", priority: "secondary" },
  "loading": { category: "Spinner Loaders", group: "UI Components", kind: "component", priority: "secondary" },
  "table": { category: "Tables", group: "UI Components", kind: "component", priority: "secondary" },
  "tab": { category: "Tabs", group: "UI Components", kind: "component", priority: "secondary" },
  "tag": { category: "Tags", group: "UI Components", kind: "component", priority: "secondary" },
  "chip": { category: "Tags", group: "UI Components", kind: "component", priority: "secondary" },
  "textarea": { category: "Text Areas", group: "UI Components", kind: "component", priority: "secondary" },
  "text-area": { category: "Text Areas", group: "UI Components", kind: "component", priority: "secondary" },
  "toast": { category: "Toasts", group: "UI Components", kind: "component", priority: "secondary" },
  "toggle": { category: "Toggles", group: "UI Components", kind: "component", priority: "secondary" },
  "switch": { category: "Toggles", group: "UI Components", kind: "component", priority: "secondary" },
  "tooltip": { category: "Tooltips", group: "UI Components", kind: "component", priority: "secondary" },
  "menus": { category: "Menus", group: "UI Components", kind: "component", priority: "secondary" },
  "context-menu": { category: "Menus", group: "UI Components", kind: "component", priority: "secondary" }
};

// Sorted by key length descending so longer matches win
const SORTED_KEYWORDS = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);

function classifyBySlug(slug) {
  const normalized = slug.toLowerCase().replace(/_/g, "-");

  for (const keyword of SORTED_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return { ...KEYWORD_MAP[keyword] };
    }
  }

  return null;
}

function classifyByTitle(title) {
  if (!title) {
    return null;
  }

  const normalized = title.toLowerCase().replace(/_/g, "-");

  for (const keyword of SORTED_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return { ...KEYWORD_MAP[keyword] };
    }
  }

  return null;
}

function classifyByCode(componentCode) {
  if (!componentCode) {
    return null;
  }

  const code = componentCode.toLowerCase();

  // Check for animation patterns suggesting section-level components
  if (code.includes("motion.section") || code.includes("motion.div") && code.length > 2000) {
    // Likely a marketing section
    return null;
  }

  // Check for form-related patterns
  if (code.includes("onsubmit") || code.includes("useform") || code.includes("handlesubmit")) {
    return { category: "Forms", group: "UI Components", kind: "component", priority: "secondary" };
  }

  return null;
}

export function classifyComponent({ slug, title, componentCode, description } = {}) {
  const result = classifyBySlug(slug ?? "") ??
    classifyByTitle(title) ??
    classifyByTitle(description) ??
    classifyByCode(componentCode);

  if (result) {
    return result;
  }

  return {
    category: "Uncategorized",
    group: "Marketing Blocks",
    kind: "section",
    priority: "secondary"
  };
}

export function classifyComponents(components) {
  return components.map((component) => ({
    ...component,
    classification: classifyComponent(component)
  }));
}
