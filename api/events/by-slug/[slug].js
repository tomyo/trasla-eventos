import { getSheetData } from "../../shared/lib/get-events.js";
import { fuzzySearch } from "../../shared/lib/fuzzy-search-events.js";
import { renderEventPage } from "../../shared/lib/render.js";

const sheetIdLegacy = typeof process !== "undefined" ? process.env?.GOOGLE_SHEET_ID_LEGACY : undefined;
const sheetGidLegacy = typeof process !== "undefined" ? process.env?.ALL_EVENTS_GOOGLE_SHEET_GID_LEGACY : undefined;
const sheetId = typeof process !== "undefined" ? process.env?.GOOGLE_SHEET_ID : undefined;
const sheetGid = typeof process !== "undefined" ? process.env?.ALL_EVENTS_GOOGLE_SHEET_GID : undefined;

export default async function handler(req) {
  const url = new URL(req.url);
  const urlSlug = url.pathname.split("/").pop();

  let eventData;
  let eventLegacyData;
  let eventIdPrefix;
  const idMatch = urlSlug.match(/([a-f0-9]{8})$/);
  if (!idMatch) {
    // slug v1: title-locality-datetime fuzzy-search
    // Currently used for event-inputs (draft events that users get redirected to right after submitting)
    const eventsLegacy = sheetIdLegacy && sheetGidLegacy ? await getSheetData(sheetIdLegacy, sheetGidLegacy) : [];
    const searchResults = fuzzySearch(eventsLegacy, urlSlug);
    eventLegacyData = searchResults[0]?.item;
    if (eventLegacyData?.eventId) {
      console.log("Found legacy event", eventLegacyData.id, "with eventId:", eventLegacyData.eventId);
      // Whole id will match as prefix aswell
      eventIdPrefix = eventLegacyData.eventId;
    }
  } else {
    // slug v2: title-eventIdPrefix
    eventIdPrefix = idMatch[1];
  }

  if (eventIdPrefix) {
    const events = await getSheetData(sheetId, sheetGid);
    eventData = events.find((event) => event.id.startsWith(eventIdPrefix));
  } else {
    eventData = eventLegacyData;
  }

  if (!eventData) {
    console.warn("No event found for slug", urlSlug, "with eventIdPrefix", eventIdPrefix);
    const debugMsg = `Evento no encontrado en ${{ urlSlug }}`;
    const msg = `${debugMsg}<br><br>
    Pruebe recargar la página o notifíquenos al <br><a target="_blank" title="WhatsApp" href="https://api.whatsapp.com/send?phone=+5493544632482&text=${encodeURI(debugMsg)}">
      3544-632482
    </a>, gracias!
    `;
    return new Response(msg, { status: 404, type: "text/html" });
  }
  if (urlSlug !== eventData.slug) {
    const canonicalUrl = `${url.origin}/${eventData.slug}`;
    return new Response(null, { status: 301, headers: { Location: canonicalUrl } });
  }

  let html = await (await fetch(`${url.origin}/index.html`)).text();

  html = renderEventPage(eventData, html, url.origin);

  // Set cache headers based on event date
  // max-age: time in seconds the browser can cache the response
  // s-maxage: time in seconds the CDN can cache the response
  // stale-while-revalidate: time in seconds the CDN can serve a stale response while it revalidates it in the background

  const day = 60 * 60 * 24;
  // For past events: cache for 7 days in browser, 60 days in CDN
  let cacheControl = `public, max-age=${day * 7}, s-maxage=${day * 60}, stale-while-revalidate=${day}, stale-if-error=${day}`;
  if (eventData) {
    const eventDate = new Date(eventData.date);
    const now = new Date();
    if (eventDate > now) {
      let maxAge = day;
      if (eventLegacyData == eventData) maxAge = 5;
      cacheControl = `public, max-age=${maxAge}, s-maxage=${maxAge * 2}, stale-while-revalidate=${maxAge * 3}, stale-if-error=${maxAge * 7}`;
    }
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": cacheControl,
    },
  });
}

export const config = {
  runtime: "edge",
};
