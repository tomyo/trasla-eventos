import { getEventSortOrder, getEventUrl, getLocalityUrl, getTimePageUrl } from "./utils.js";

export function generateSitemapXml(events, origin) {
  events.sort((a, b) => {
    return getEventSortOrder(b) - getEventSortOrder(a); // descending order
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const lastModNow = new Date().toISOString();

  const mainPage = `<url>
    <loc>${origin}</loc>
    <lastmod>${lastModNow}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/que-es-trasla-eventos.html</loc>
    <lastmod>2026-01-06T15:13:57.717Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

  const localitiesInEvents = [];
  let localitiesPagesXml = "";
  let timeBasedPagesXml = "";
  let eventsXml = "";
  let newestEventUpdatedAt;

  events.forEach((event) => {
    const updatedAt = new Date(event.updatedAt);
    if (updatedAt > newestEventUpdatedAt || !newestEventUpdatedAt) {
      newestEventUpdatedAt = updatedAt;
    }
    eventsXml += `
            <url>
              <loc>${getEventUrl(event.slug, origin)}</loc>
              <lastmod>${event.updatedAt || event.startsAt || lastModNow}</lastmod>
              <changefreq>daily</changefreq>
              <priority>0.7</priority>
            </url>
          `;
    if (!localitiesInEvents.includes(event.locality)) {
      // Add locality page to sitemap if it doesn't exist
      localitiesInEvents.push(event.locality);
      localitiesPagesXml += `
            <url>
              <loc>${getLocalityUrl(event.locality, origin)}</loc>
              <lastmod>${lastModNow}</lastmod>
              <changefreq>daily</changefreq>
              <priority>0.9</priority>
            </url>
          `;
    }
  });

  for (const when of ["hoy", "esta-semana", "este-mes"]) {
    timeBasedPagesXml += `
            <url>
              <loc>${getTimePageUrl(when, origin)}</loc>
              <lastmod>${newestEventUpdatedAt?.toISOString() || lastModNow}</lastmod>
              <changefreq>${when === "hoy" ? "hourly" : "daily"}</changefreq>
              <priority>0.9</priority>
            </url>
          `;
  }

  xml += mainPage + timeBasedPagesXml + localitiesPagesXml + eventsXml + "</urlset>";
  return xml;
}
