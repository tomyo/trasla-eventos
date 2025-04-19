import { getGoogleSheetEvents } from "./shared/lib/get-events.js";

let sheetId = typeof process !== "undefined" ? process.env?.GOOGLE_SHEET_ID : undefined;
let sheetGid = typeof process !== "undefined" ? process.env?.ALL_EVENTS_GOOGLE_SHEET_GID : undefined;
export default async function handler(req) {
  const url = new URL(req.url);
  const events = await getGoogleSheetEvents(sheetId, sheetGid);
  events.sort((a, b) => {
    return Number(new Date(b.startsAt)) - Number(new Date(a.startsAt)); // descending order
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const lastModNow = new Date().toISOString();

  const mainPage = `<url>
        <loc>${url.origin}</loc>
        <lastmod>${lastModNow}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>1.0</priority>
      </url>`;

  const eventsXml = events
    .map((event) => {
      const isPastEvent = new Date(event.startsAt) <= new Date();
      return `
            <url>
              <loc>${url.origin}/${event.slug}</loc>
              <lastmod>${event.updatedAt || event.startsAt || lastModNow}</lastmod>
              <changefreq>${isPastEvent ? "never" : "daily"}</changefreq>
              <priority>${isPastEvent ? "0.4" : "0.8"}</priority>
            </url>
          `;
    })
    .join("");

  xml += mainPage + eventsXml + "</urlset>";

  const oneMinute = 60;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": `public, s-maxage=${oneMinute}, stale-while-revalidate=${oneMinute}`,
    },
  });
}

export const config = {
  runtime: "edge",
};
