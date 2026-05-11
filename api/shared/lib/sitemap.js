import { getEventSortOrder, getEventUrl, getLocalityUrl, getTimePageUrl, isDateToday, isDateWithinWeek, isDateWithinMonth } from "./utils.js";

export function generateSitemapXml(events, origin) {
  events.sort((a, b) => {
    return getEventSortOrder(b) - getEventSortOrder(a); // descending order
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const lastModNow = new Date().toISOString();
  
  // Calculate max updatedAt globally and per locality
  let maxGlobalUpdatedAt = null;
  const maxLocalityUpdatedAt = new Map();
  
  events.forEach((event) => {
    const updatedAt = new Date(event.updatedAt || event.startsAt || lastModNow);
    if (!maxGlobalUpdatedAt || updatedAt > maxGlobalUpdatedAt) {
      maxGlobalUpdatedAt = updatedAt;
    }
    
    const localityMax = maxLocalityUpdatedAt.get(event.locality);
    if (!localityMax || updatedAt > localityMax) {
      maxLocalityUpdatedAt.set(event.locality, updatedAt);
    }
  });

  const mainPage = `<url>
    <loc>${origin}</loc>
    <lastmod>${(maxGlobalUpdatedAt || new Date(lastModNow)).toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/que-es-trasla-eventos.html</loc>
    <lastmod>2026-01-06T15:13:57.717Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

  let localitiesPagesXml = "";
  let timeBasedPagesXml = "";
  let eventsXml = "";

  events.forEach((event) => {
    eventsXml += `
            <url>
              <loc>${getEventUrl(event.slug, origin)}</loc>
              <lastmod>${event.updatedAt || event.startsAt || lastModNow}</lastmod>
              <changefreq>daily</changefreq>
              <priority>0.7</priority>
            </url>
          `;
  });

  for (const [locality, maxUpdated] of maxLocalityUpdatedAt.entries()) {
    localitiesPagesXml += `
            <url>
              <loc>${getLocalityUrl(locality, origin)}</loc>
              <lastmod>${maxUpdated.toISOString()}</lastmod>
              <changefreq>daily</changefreq>
              <priority>0.9</priority>
            </url>
          `;
  }

  const getTimeFilter = (when) => {
    if (when === "hoy") return (e) => isDateToday(new Date(e.startsAt));
    if (when === "esta-semana") return (e) => isDateWithinWeek(new Date(e.startsAt));
    if (when === "este-mes") return (e) => isDateWithinMonth(new Date(e.startsAt));
    return () => true;
  };

  for (const when of ["hoy", "esta-semana", "este-mes"]) {
    const filter = getTimeFilter(when);
    const filteredEvents = events.filter(filter);
    
    let maxWhenUpdated = null;
    filteredEvents.forEach((event) => {
      const updatedAt = new Date(event.updatedAt || event.startsAt || lastModNow);
      if (!maxWhenUpdated || updatedAt > maxWhenUpdated) {
        maxWhenUpdated = updatedAt;
      }
    });

    timeBasedPagesXml += `
            <url>
              <loc>${getTimePageUrl(when, origin)}</loc>
              <lastmod>${maxWhenUpdated ? maxWhenUpdated.toISOString() : (maxGlobalUpdatedAt || new Date(lastModNow)).toISOString()}</lastmod>
              <changefreq>${when === "hoy" ? "hourly" : "daily"}</changefreq>
              <priority>0.9</priority>
            </url>
          `;
  }

  xml += mainPage + timeBasedPagesXml + localitiesPagesXml + eventsXml + "</urlset>";
  return xml;
}
