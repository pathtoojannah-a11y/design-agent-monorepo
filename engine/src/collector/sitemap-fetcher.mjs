import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { ensureDir, fileExists, loadJson, saveJson } from "../io.mjs";
import { getDefaultCacheDir } from "./cache-paths.mjs";

const SITEMAP_URL = "https://21st.dev/sitemap.xml";
const STALE_MS = 24 * 60 * 60 * 1000;

// Matches: /community/components/{creator}/{component-name} with optional variant suffix
const LOC_PATTERN = /<loc>([^<]+)<\/loc>/g;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "design-intelligence-collector/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve, reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseSitemapUrls(xml) {
  const seen = new Set();
  const results = [];
  const SKIP_SLUGS = new Set(["popular", "newest", "featured", "week", "month"]);

  for (const match of xml.matchAll(LOC_PATTERN)) {
    const url = match[1].trim();

    // Only match /community/components/{creator}/{slug} (4 path segments)
    // Also allow /community/components/{creator}/{slug}/{variant} (5 segments)
    let pathname;
    try {
      pathname = new URL(url).pathname;
    } catch {
      continue;
    }

    const parts = pathname.split("/").filter(Boolean);
    // Must be: community/components/{creator}/{slug}[/{variant}]
    if (parts.length < 4 || parts[0] !== "community" || parts[1] !== "components") {
      continue;
    }

    const creator = parts[2];
    // Build slug from remaining segments
    const slug = parts.slice(3).join("/");

    if (SKIP_SLUGS.has(creator) || SKIP_SLUGS.has(slug)) {
      continue;
    }

    if (seen.has(url)) {
      continue;
    }

    seen.add(url);
    results.push({ creator, slug, url });
  }

  return results;
}

function getSitemapCachePath(cacheDir) {
  return path.resolve(cacheDir, "sitemap-urls.json");
}

function isCacheFresh(cachePath) {
  if (!fileExists(cachePath)) {
    return false;
  }

  try {
    const cached = loadJson(cachePath);
    const age = Date.now() - Date.parse(cached.fetchedAt);
    return Number.isFinite(age) && age < STALE_MS;
  } catch {
    return false;
  }
}

export async function fetchSitemapUrls({ cacheDir = getDefaultCacheDir(), force = false } = {}) {
  ensureDir(cacheDir);
  const cachePath = getSitemapCachePath(cacheDir);

  if (!force && isCacheFresh(cachePath)) {
    const cached = loadJson(cachePath);
    return cached.urls;
  }

  const xml = await fetchUrl(SITEMAP_URL);
  const urls = parseSitemapUrls(xml);

  saveJson(cachePath, {
    fetchedAt: new Date().toISOString(),
    source: SITEMAP_URL,
    count: urls.length,
    urls
  });

  return urls;
}

export { parseSitemapUrls, fetchUrl };
