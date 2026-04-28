import { getGoogleSheetEvents } from "../../shared/lib/get-events.js";
import { fuzzySearch } from "../../shared/lib/fuzzy-search-events.js";
import { escapeHtml, getGoogleDriveImagesPreview, eventToSchemaEventItem, renderEventEntry } from "../../shared/lib/utils.js";

const OG_IMAGE_WIDTH = 1200;
let sheetId = typeof process !== "undefined" ? process.env?.GOOGLE_SHEET_ID : undefined;
let sheetGid = typeof process !== "undefined" ? process.env?.ALL_EVENTS_GOOGLE_SHEET_GID : undefined;
let sheetIdLegacy = typeof process !== "undefined" ? process.env?.GOOGLE_SHEET_ID_LEGACY : undefined;
let sheetGidLegacy = typeof process !== "undefined" ? process.env?.ALL_EVENTS_GOOGLE_SHEET_GID_LEGACY : undefined;

export default async function handler(req) {
  const url = new URL(req.url);
  const urlSlug = url.pathname.split("/").pop();
  const events = await getGoogleSheetEvents(sheetId, sheetGid);

  const idMatch = urlSlug.match(/([a-f0-9]{8})$/);
  let idPrefix;
  let eventLegacyData;
  if (idMatch) {
    // slug v2: title-idPrefix
    idPrefix = idMatch[1];
  } else {
    // slug v1: title-locality-datetime fuzzy-search
    const eventsLegacy = sheetIdLegacy && sheetGidLegacy ? await getGoogleSheetEvents(sheetIdLegacy, sheetGidLegacy) : events;
    const searchResults = fuzzySearch(eventsLegacy, urlSlug);
    eventLegacyData = searchResults[0]?.item;
    if (eventLegacyData) {
      console.log("Found legacy event", eventLegacyData.id, "with eventId:", eventLegacyData.eventId);
      if (eventLegacyData.eventId) idPrefix = eventLegacyData.eventId; // Whole id will match as prefix aswell
    }
  }
  const eventData = idPrefix ? events.find((event) => event.id.startsWith(idPrefix)) : eventLegacyData;

  if (!eventData) {
    console.warn("No event found for slug", urlSlug, "with idPrefix", idPrefix);
    const debugMsg = `Evento no encontrado en ${{ urlSlug }}`;
    const msg = `${debugMsg}
    Pruebe recargar la página o notifíquenos al <a target="_blank" title="WhatsApp" href="https://api.whatsapp.com/send?phone=+5493544632482&text=${encodeURI(debugMsg)}">
      3544-632482
    </a>, gracias!
    `;
    return new Response(msg, { status: 404 });
  }
  if (urlSlug !== eventData.slug) {
    const canonicalUrl = `${url.origin}/${eventData.slug}`;
    return new Response(null, { status: 301, headers: { Location: canonicalUrl } });
  }

  let html = await (await fetch(`${url.origin}/index.html`)).text();

  if (eventData) {
    const previewImageUrl = getGoogleDriveImagesPreview(eventData.images, OG_IMAGE_WIDTH);
    const contentMeta = /*html*/ `
      <title>${escapeHtml(eventData.title)}</title>
      <link
        rel="canonical"
        property="og:url"
        href="${url.origin}/${eventData.slug}"
      />
      <meta property="og:title" content="${escapeHtml(eventData.title)}" />
      <meta
        name="description"
        property="og:description"
        content="${escapeHtml(eventData.description)}"
      />
      <meta property="og:image" content="${previewImageUrl}" />
      <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />
      <meta property="og:type" content="event" />
      <meta property="og:url" content="${url.origin}/${eventData.slug}" />
      <meta property="og:site_name" content="TRASLA EVENTOS" />
      <meta property="og:locale" content="es-AR" />
      <script type="application/ld+json">
        ${JSON.stringify({
          "@context": "https://schema.org",
          ...eventToSchemaEventItem(eventData, url.origin),
        })}
      </script>
    `;

    const contentMetaRegex = /<!-- START CONTENT_METADATA_BLOCK -->[\s\S]*?<!-- END CONTENT_METADATA_BLOCK -->/;
    html = html.replace(contentMetaRegex, contentMeta);

    const eventEntry = renderEventEntry(eventData);
    html = html.replace(
      /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/is,
      () => `<event-entries>${eventEntry}</event-entries>`,
    );
    html = html.replace(/(?<openTag><form[^>]*>).*?(?<closeTag><\/form>)/is, () => ``);
    html = html.replace(/<div\s*slot="actions">[\s\S]*?<\/div>/i, "");
  }

  // Set cache headers based on event date
  // max-age: time in seconds the browser can cache the response
  // s-maxage: time in seconds the CDN can cache the response
  // stale-while-revalidate: time in seconds the CDN can serve a stale response while it revalidates it in the background

  const day = 1000 * 60 * 60 * 24;
  // For past events: cache for two months (60 days) in CDN, 7 days in browser
  let cacheControl = `public, max-age=${day * 7}, s-maxage=${day * 60}, stale-while-revalidate=${day}, stale-if-error=${day}`;
  if (eventData) {
    const eventDate = new Date(eventData.date);
    const now = new Date();
    if (eventDate > now) {
      // For future events: cache for 5 days in CDN, 1 day in browser
      cacheControl = `public, max-age=${day}, s-maxage=${day * 5}, stale-while-revalidate=${day}, stale-if-error=${day}`;
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
