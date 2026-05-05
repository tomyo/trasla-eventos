import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderLocalityPage, renderTimePage, renderEventPage } from "../lib/render.js";
import { getUpcomingEventsPublicSheetData, getAllEventsPublicSheetData } from "../lib/get-events.js";
import { localitiesData, slugify } from "../lib/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const eventsDir = path.join(distDir, "e");

// Default origin for the canonical URLs and OG tags during build
const ORIGIN = process.env.URL || "https://eventos.trasla.com.ar";

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

async function build() {
  console.log("Starting static build...");
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });

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

  const templateHtml = await fs.readFile(path.join(rootDir, "index.html"), "utf-8");

  // 2. Fetch events
  console.log("Fetching upcoming events data...");
  const upcomingEvents = await getUpcomingEventsPublicSheetData();
  console.log(`✅ ${upcomingEvents.length} events received.\n`);

  // 3. Render locality pages
  console.log("Rendering locality pages...");
  for (const localityData of localitiesData) {
    const locality = localityData.locality;
    if (locality === "Virtual") continue;

    try {
      const html = renderLocalityPage(locality, upcomingEvents, templateHtml, ORIGIN);
      const outDir = path.join(distDir, "lugar", slugify(locality));
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    } catch (e) {
      console.error(`Error rendering locality ${locality}:`, e);
    }
  }

  // 4. Render time pages
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

  // 5. Render event pages
  console.log("Fetching all events data...");
  const events = await getAllEventsPublicSheetData();
  console.log(`✅ ${events.length} events received.\n`);
  console.log("Rendering event pages...");
  for (const event of events) {
    try {
      const html = renderEventPage(event, templateHtml, ORIGIN);
      const outDir = path.join(eventsDir, event.slug);
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
    } catch (e) {
      console.error(`Error rendering event page ${event.slug}:`, e);
    }
  }

  console.log("Static build completed successfully.");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
