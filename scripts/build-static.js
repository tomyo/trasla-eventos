import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderLocalityPage, renderTimePage, renderEventPage, renderIndexPage } from "../lib/render.js";
import { getUpcomingEventsPublicSheetData, getAllEventsPublicSheetData } from "../lib/get-events.js";
import { localitiesData, slugify, BASE_URL, getEventPath, makeCssToHideAbsentLocalitiesInFooter } from "../lib/utils.js";
import { generateSitemaps } from "../lib/sitemap.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const eventsDir = path.join(distDir, getEventPath(""));

// Default origin for the canonical URLs and OG tags during build
const ORIGIN = process.env.URL || BASE_URL;

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const targetPath = await fs.realpath(srcPath);
      const stats = await fs.stat(targetPath);
      if (stats.isDirectory()) {
        await copyDir(targetPath, destPath);
      } else {
        await fs.copyFile(targetPath, destPath);
      }
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

const DIRS_TO_OMIT_IN_COPY = ["node_modules", "tests", "scripts", "dist", "api", "gas", "worktrees"];
const OMIT_NAMES_STARTING_WITH = ["."];

const isFastMode = process.argv.includes("--fast");

async function exportApiData() {
  const DATA_DIR = path.join(distDir, "data");
  const CACHE_UPCOMING_PATH = path.join(DATA_DIR, "events.json");
  const CACHE_ALL_PATH = path.join(DATA_DIR, "events-all.json");

  await fs.mkdir(DATA_DIR, { recursive: true });

  const hasCache =
    (await fs
      .access(CACHE_UPCOMING_PATH)
      .then(() => true)
      .catch(() => false)) &&
    (await fs
      .access(CACHE_ALL_PATH)
      .then(() => true)
      .catch(() => false));

  let upcomingEvents, events;

  if (isFastMode && hasCache) {
    console.log("⚡ Fast mode: Loading events from cache...");
    upcomingEvents = JSON.parse(await fs.readFile(CACHE_UPCOMING_PATH, "utf-8"));
    events = JSON.parse(await fs.readFile(CACHE_ALL_PATH, "utf-8"));
  } else {
    console.log("Fetching events data for static API export...");
    upcomingEvents = await getUpcomingEventsPublicSheetData();
    events = await getAllEventsPublicSheetData();
    await fs.writeFile(CACHE_UPCOMING_PATH, JSON.stringify(upcomingEvents), "utf-8");
    await fs.writeFile(CACHE_ALL_PATH, JSON.stringify(events), "utf-8");
    console.log("✅ Static API endpoints generated in /data.");
  }

  if (!upcomingEvents?.length || !events?.length) {
    throw new Error(`Failed to load events. Upcoming: ${upcomingEvents?.length}, All: ${events?.length}`);
  }

  console.log(`✅ ${upcomingEvents.length} upcoming events ready.`);
  console.log(`✅ ${events.length} total events ready.\n`);

  return { upcomingEvents, events };
}

async function build({ upcomingEvents, events }) {
  console.log(isFastMode ? "Starting fast static build..." : "Starting static build...");
  // Ensure distDir exists and empty it if it does
  await fs.mkdir(distDir, { recursive: true });
  if (!isFastMode) {
    const distEntries = await fs.readdir(distDir);
    await Promise.all(distEntries.map((entry) => fs.rm(path.join(distDir, entry), { recursive: true, force: true })));
  }

  // 1. Copy static assets
  console.log("Copying static files and directories...");
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (DIRS_TO_OMIT_IN_COPY.includes(entry.name)) continue;
    if (OMIT_NAMES_STARTING_WITH.some((prefix) => entry.name.startsWith(prefix))) continue;

    const srcPath = path.join(rootDir, entry.name);
    const destPath = path.join(distDir, entry.name);

    try {
      const stats = await fs.stat(srcPath);
      if (stats.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    } catch (e) {
      console.warn(`Could not copy ${entry.name}: ${e.message}`);
    }
  }

  let templateHtml = await fs.readFile(path.join(rootDir, "index.html"), "utf-8");

  const siteHeaderHtml = await fs.readFile(path.join(rootDir, "components/site-header/site-header.html"), "utf-8");
  const siteFooterHtml = await fs.readFile(path.join(rootDir, "components/site-footer/site-footer.html"), "utf-8");

  const siteHeaderCss = await fs.readFile(path.join(rootDir, "components/site-header/site-header.css"), "utf-8");
  const siteFooterCss = await fs.readFile(path.join(rootDir, "components/site-footer/site-footer.css"), "utf-8");

  // Inject their CSS inline into the head
  templateHtml = templateHtml.replace(
    /<\/head>/i,
    /*html*/ `
    <style id="site-header-style">${siteHeaderCss}</style>
    <style id="site-footer-style">${siteFooterCss}</style>
    </head>`,
  );

  // Inject Header and Footer into the template HTML directly
  templateHtml = templateHtml.replace(/<site-header>.*?<\/site-header>/is, `<site-header>\n${siteHeaderHtml}\n</site-header>`);
  templateHtml = templateHtml.replace(/<site-footer>.*?<\/site-footer>/is, `<site-footer>\n${siteFooterHtml}\n</site-footer>`);

  // 2. Append CSS to hide absent localities in footer into dist/base.css
  const activeLocalities = [...new Set(upcomingEvents.map((event) => event.locality))];
  const hideLocalitiesCss = makeCssToHideAbsentLocalitiesInFooter(activeLocalities);

  const baseCssPath = path.join(distDir, "base.css");
  try {
    const baseCssContent = await fs.readFile(baseCssPath, "utf-8");
    await fs.writeFile(
      baseCssPath,
      baseCssContent + "\n\n/* Injected during build to hide absent localities from footer */\n" + hideLocalitiesCss + "\n",
      "utf-8",
    );
  } catch (e) {
    console.warn("Could not append hide-absent-localities to base.css:", e);
  }

  // 3. Render main index page
  console.log("Rendering index.html...");
  try {
    const indexHtml = renderIndexPage(upcomingEvents, templateHtml, ORIGIN);
    await fs.writeFile(path.join(distDir, "index.html"), indexHtml, "utf-8");
    console.log("✅ index.html rendered.");
  } catch (e) {
    console.error("Error rendering index.html:", e);
  }

  // 4. Render locality pages
  console.log("Rendering locality pages...");
  for (const localityData of localitiesData) {
    const locality = localityData.locality;

    try {
      const html = renderLocalityPage(locality, upcomingEvents, templateHtml, ORIGIN);
      const outDir = path.join(distDir, "lugar", slugify(locality));
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    } catch (e) {
      console.error(`Error rendering locality ${locality}:`, e);
    }
  }
  console.log("✅ Locality pages rendered.");

  // 5. Render time pages
  console.log("Rendering time pages...");
  for (const when of ["hoy", "esta-semana", "este-mes"]) {
    try {
      const html = renderTimePage(when, upcomingEvents, templateHtml, ORIGIN);
      const outDir = path.join(distDir, `eventos-${when}`);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    } catch (e) {
      console.error(`Error rendering time page ${when}:`, e);
    }
  }
  console.log("✅ Time pages rendered.");

  // 6. Render event pages
  console.log("Rendering event pages...");
  for (const event of events) {
    try {
      const html = renderEventPage(event, templateHtml, ORIGIN);
      await fs.mkdir(eventsDir, { recursive: true });
      await fs.writeFile(path.join(eventsDir, `${event.slug}.html`), html, "utf-8");
    } catch (e) {
      console.error(`Error rendering event page ${event.slug}:`, e);
    }
  }
  console.log("✅ Event pages rendered.");

  // 7. Generate sitemaps
  console.log("Generating sitemaps...");
  try {
    const { sitemapIndex, mainXml, upcomingEventsXml, pastEventsXml } = generateSitemaps(upcomingEvents, events, ORIGIN);
    const sitemapsDir = path.join(distDir, "sitemaps");
    await fs.mkdir(sitemapsDir, { recursive: true });

    await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemapIndex, "utf-8");
    await fs.writeFile(path.join(sitemapsDir, "main.xml"), mainXml, "utf-8");
    await fs.writeFile(path.join(sitemapsDir, "upcoming-events.xml"), upcomingEventsXml, "utf-8");
    await fs.writeFile(path.join(sitemapsDir, "past-events.xml"), pastEventsXml, "utf-8");
    console.log("✅ Sitemaps generated (index, main, upcoming, past).");
  } catch (e) {
    console.error("Error generating sitemaps:", e);
  }

  console.log("✅ Static build completed successfully.");
}

async function main() {
  try {
    const data = await exportApiData();
    await build(data);
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

main();
