import {
  getEventSortOrder,
  getEventUrl,
  getLocalityUrl,
  getTimePageUrl,
  isDateToday,
  isDateWithinWeek,
  isDateWithinMonth,
} from "./utils.js";

function getSitemapWrapper(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${content}\n</urlset>`;
}

export function generateSitemaps(upcomingEvents, allEvents, origin) {
  const lastModNow = new Date().toISOString();

  // --- main.xml ---
  let maxGlobalUpdatedAt = null;
  // Deduplicate by canonical locality URL (slug) to avoid duplicate entries from
  // casing/spacing variants like "Villa de Las Rosas" vs "Villa de las Rosas"
  // or "Arroyo de Los Patos" vs "Arroyo de los Patos".
  const maxLocalityUpdatedAt = new Map();

  upcomingEvents.forEach((event) => {
    const updatedAt = new Date(event.updatedAt || event.startsAt || lastModNow);
    if (!maxGlobalUpdatedAt || updatedAt > maxGlobalUpdatedAt) {
      maxGlobalUpdatedAt = updatedAt;
    }

    if (!event.locality) return;
    const url = getLocalityUrl(event.locality, origin);
    // Skip empty/invalid locality that slugifies to empty
    if (!url || url.endsWith("/lugar//")) return;
    const localityMax = maxLocalityUpdatedAt.get(url);
    if (!localityMax || updatedAt > localityMax) {
      maxLocalityUpdatedAt.set(url, updatedAt);
    }
  });

  let mainContent = `<url>
    <loc>${origin}</loc>
    <lastmod>${(maxGlobalUpdatedAt || new Date(lastModNow)).toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/que-es-trasla-eventos</loc>
    <lastmod>2026-01-06T15:13:57.717Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

  for (const [url, maxUpdated] of maxLocalityUpdatedAt.entries()) {
    mainContent += `
      <url>
        <loc>${url}</loc>
        <lastmod>${maxUpdated.toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>`;
  }

  const getTimeFilter = (when) => {
    if (when === "hoy") return (e) => isDateToday(new Date(e.startsAt));
    if (when === "esta-semana") return (e) => isDateWithinWeek(new Date(e.startsAt));
    if (when === "este-mes") return (e) => isDateWithinMonth(new Date(e.startsAt));
    return () => true;
  };

  for (const when of ["hoy", "esta-semana", "este-mes"]) {
    const filter = getTimeFilter(when);
    const filteredEvents = upcomingEvents.filter(filter);

    let maxWhenUpdated = null;
    filteredEvents.forEach((event) => {
      const updatedAt = new Date(event.updatedAt || event.startsAt || lastModNow);
      if (!maxWhenUpdated || updatedAt > maxWhenUpdated) {
        maxWhenUpdated = updatedAt;
      }
    });

    mainContent += `
      <url>
        <loc>${getTimePageUrl(when, origin)}</loc>
        <lastmod>${maxWhenUpdated ? maxWhenUpdated.toISOString() : (maxGlobalUpdatedAt || new Date(lastModNow)).toISOString()}</lastmod>
        <changefreq>${when === "hoy" ? "hourly" : "daily"}</changefreq>
        <priority>0.9</priority>
      </url>`;
  }

  const mainXml = getSitemapWrapper(mainContent);

  // --- upcoming-events.xml ---
  let upcomingContent = "";
  upcomingEvents
    .sort((a, b) => getEventSortOrder(b) - getEventSortOrder(a))
    .forEach((event) => {
      upcomingContent += `
      <url>
        <loc>${getEventUrl(event.slug, origin)}</loc>
        <lastmod>${event.updatedAt || event.startsAt || lastModNow}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>`;
    });
  const upcomingEventsXml = getSitemapWrapper(upcomingContent);

  // --- sitemap.xml (index) ---
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
    <loc>${origin}/sitemaps/main.xml</loc>
    <lastmod>${lastModNow}</lastmod>
    </sitemap>
    <sitemap>
    <loc>${origin}/sitemaps/upcoming-events.xml</loc>
    <lastmod>${lastModNow}</lastmod>
    </sitemap>
  </sitemapindex>`;

  return {
    sitemapIndex,
    mainXml,
    upcomingEventsXml,
  };
}
