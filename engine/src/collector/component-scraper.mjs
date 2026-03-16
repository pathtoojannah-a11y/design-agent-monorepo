import { fetchUrl } from "./sitemap-fetcher.mjs";

const RATE_LIMIT_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRscChunks(html) {
  const pushes = html.match(/self\.__next_f\.push\(\[[\s\S]*?\]\)/g) || [];
  return pushes;
}

function extractRscComponentData(html) {
  const chunks = extractRscChunks(html);

  // Find the chunk containing component_slug and component data with CDN URLs
  for (const chunk of chunks) {
    if (!chunk.includes("component_slug") || !chunk.includes("cdn.21st.dev")) {
      continue;
    }

    // RSC data uses escaped quotes: \\\" in the raw HTML
    // We need to match both escaped and unescaped patterns
    const Q = `(?:\\\\"|")`;  // matches either \" or "
    const VAL = `((?:[^"\\\\]|\\\\.)*)`;  // value inside quotes

    const codeUrlMatch = chunk.match(new RegExp(`\\\\?"code\\\\?"\\s*:\\s*\\\\?"(https://cdn\\.21st\\.dev/[^"\\\\]+)\\\\?"`));
    const nameMatch = chunk.match(new RegExp(`\\\\?"name\\\\?"\\s*:\\s*\\\\?"([^"\\\\]+)\\\\?"`));
    const slugMatch = chunk.match(new RegExp(`\\\\?"component_slug\\\\?"\\s*:\\s*\\\\?"([^"\\\\]+)\\\\?"`));
    const licenseMatch = chunk.match(new RegExp(`\\\\?"license\\\\?"\\s*:\\s*\\\\?"([^"\\\\]+)\\\\?"`));
    const previewMatch = chunk.match(new RegExp(`\\\\?"preview_url\\\\?"\\s*:\\s*\\\\?"([^"\\\\]+)\\\\?"`));
    const descMatch = chunk.match(new RegExp(`\\\\?"description\\\\?"\\s*:\\s*\\\\?"((?:[^"\\\\]|\\\\.)*)\\\\?"`));
    const demoCodeMatch = chunk.match(new RegExp(`\\\\?"demo_code\\\\?"\\s*:\\s*\\\\?"(https://cdn\\.21st\\.dev/[^"\\\\]+)\\\\?"`));

    // Extract dependencies — match the JSON object after "dependencies":
    const depsMatch = chunk.match(/\\?"dependencies\\?"\s*:\s*\{([^}]*)\}/);
    const demoDepsMatch = chunk.match(/\\?"demo_dependencies\\?"\s*:\s*\{([^}]*)\}/);
    const registryDepsMatch = chunk.match(/\\?"direct_registry_dependencies\\?"\s*:\s*\[([^\]]*)\]/);

    // Extract user info
    const usernameMatch = chunk.match(/\\?"username\\?"\s*:\s*\\?"([^"\\]+)\\?"/);

    if (!codeUrlMatch && !nameMatch) {
      continue;
    }

    const dependencies = {};
    if (depsMatch) {
      for (const pair of depsMatch[1].matchAll(/\\?"([^"\\]+)\\?"\s*:\s*\\?"([^"\\]+)\\?"/g)) {
        dependencies[pair[1]] = pair[2];
      }
    }

    const demoDependencies = {};
    if (demoDepsMatch) {
      for (const pair of demoDepsMatch[1].matchAll(/\\?"([^"\\]+)\\?"\s*:\s*\\?"([^"\\]+)\\?"/g)) {
        demoDependencies[pair[1]] = pair[2];
      }
    }

    return {
      codeUrl: codeUrlMatch?.[1] ?? null,
      demoCodeUrl: demoCodeMatch?.[1] ?? null,
      name: nameMatch?.[1] ?? null,
      componentSlug: slugMatch?.[1] ?? null,
      license: licenseMatch?.[1] ?? null,
      previewUrl: previewMatch?.[1] ?? null,
      description: descMatch?.[1]?.replace(/\\n/g, "\n").replace(/\\"/g, '"') ?? null,
      dependencies,
      demoDependencies,
      registryDeps: registryDepsMatch?.[1]?.match(/\\?"([^"\\]+)\\?"/g)?.map((s) => s.replace(/\\?"/g, "")) ?? [],
      author: usernameMatch?.[1] ?? null
    };
  }

  return null;
}

function extractMetaContent(html, property) {
  const pattern = new RegExp(
    `<meta[^>]*(?:name|property)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function extractTitle(html) {
  // Try RSC-embedded title first
  const rscTitle = html.match(/"og:title","content":"([^"]+)"/)?.[1];
  if (rscTitle && !rscTitle.includes("Component Not Found")) {
    return rscTitle.replace(/\s*\|\s*(?:Community Components\s*-?\s*)?21st.*$/i, "").trim();
  }

  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle && !ogTitle.includes("Component Not Found")) {
    return ogTitle.replace(/\s*[-|]\s*21st.*$/i, "").trim();
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && !titleMatch[1].includes("Component Not Found")) {
    return titleMatch[1].replace(/\s*[-|]\s*(?:Community Components\s*-?\s*)?21st.*$/i, "").trim();
  }

  return null;
}

function extractImportsFromCode(code) {
  const packages = new Set();
  const importPattern = /(?:import|require)\s*(?:\(?\s*['"])([^'"./][^'"]*)['"]/g;

  for (const match of code.matchAll(importPattern)) {
    let pkg = match[1];
    if (pkg.startsWith("@")) {
      const parts = pkg.split("/");
      pkg = parts.slice(0, 2).join("/");
    } else {
      pkg = pkg.split("/")[0];
    }

    if (!pkg.startsWith(".") && pkg !== "react" && pkg !== "react-dom" && !pkg.startsWith("next/")) {
      packages.add(pkg);
    }
  }

  return [...packages].sort();
}

function extractShadcnDeps(code) {
  const deps = new Set();
  const pattern = /from\s+["']@\/components\/ui\/([^"']+)["']/g;

  for (const match of code.matchAll(pattern)) {
    deps.add(match[1].replace(/\.tsx?$/, ""));
  }

  return [...deps].sort();
}

export async function scrapeComponentPage(url) {
  let html;
  try {
    html = await fetchUrl(url);
  } catch (err) {
    if (err.message?.includes("404")) {
      return null;
    }
    throw err;
  }

  // Check for "Component Not Found"
  if (html.includes("Component Not Found")) {
    return null;
  }

  const rscData = extractRscComponentData(html);
  const title = rscData?.name ?? extractTitle(html);
  const description = rscData?.description ?? extractMetaContent(html, "og:description") ?? null;

  if (!rscData) {
    // No structured data found — return metadata only
    return {
      url,
      title,
      description,
      author: null,
      license: null,
      previewImage: extractMetaContent(html, "og:image") ?? null,
      componentCode: null,
      demoCode: null,
      dependencyFiles: [],
      npmPackages: [],
      shadcnDeps: [],
      installCommand: null,
      hasStructuredData: false,
      codeBlockCount: 0
    };
  }

  // Fetch actual source code from CDN URLs
  let componentCode = null;
  let demoCode = null;

  if (rscData.codeUrl) {
    try {
      componentCode = await fetchUrl(rscData.codeUrl);
    } catch {
      // CDN fetch failed — record as metadata-only
    }
  }

  if (rscData.demoCodeUrl) {
    try {
      demoCode = await fetchUrl(rscData.demoCodeUrl);
    } catch {
      // Demo code fetch failed — non-critical
    }
  }

  // Build npm packages list from declared dependencies + code analysis
  const declaredDeps = Object.keys(rscData.dependencies ?? {});
  const declaredDemoDeps = Object.keys(rscData.demoDependencies ?? {});
  let npmPackages = [...new Set([...declaredDeps, ...declaredDemoDeps])].sort();

  // Supplement with imports found in code
  if (componentCode) {
    const codeDeps = extractImportsFromCode(componentCode);
    npmPackages = [...new Set([...npmPackages, ...codeDeps])].sort();
  }

  const shadcnDeps = componentCode ? extractShadcnDeps(componentCode) : [];
  const installCommand = npmPackages.length > 0 ? `npm install ${npmPackages.join(" ")}` : null;

  return {
    url,
    title: title ?? rscData.componentSlug,
    description,
    author: rscData.author,
    license: rscData.license,
    previewImage: rscData.previewUrl ?? extractMetaContent(html, "og:image") ?? null,
    componentCode,
    demoCode,
    dependencyFiles: [],
    npmPackages,
    shadcnDeps,
    installCommand,
    hasStructuredData: true,
    codeBlockCount: 0,
    registryDeps: rscData.registryDeps ?? []
  };
}

export async function scrapeComponents(urls, { onProgress, limit, resume } = {}) {
  const results = [];
  const errors = [];
  const toProcess = limit ? urls.slice(0, limit) : urls;

  for (let i = 0; i < toProcess.length; i++) {
    const entry = toProcess[i];
    const url = typeof entry === "string" ? entry : entry.url;

    if (resume?.has?.(url)) {
      continue;
    }

    try {
      const result = await scrapeComponentPage(url);

      if (result) {
        results.push({ ...entry, ...result });
      } else {
        errors.push({ url, error: "404 or empty" });
      }

      if (onProgress) {
        onProgress({
          index: i + 1,
          total: toProcess.length,
          url,
          success: result != null
        });
      }
    } catch (err) {
      errors.push({ url, error: err.message });

      if (onProgress) {
        onProgress({
          index: i + 1,
          total: toProcess.length,
          url,
          success: false,
          error: err.message
        });
      }
    }

    // Rate limit between requests
    if (i < toProcess.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  return { results, errors };
}
