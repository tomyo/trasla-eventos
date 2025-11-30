import { getGoogleSheetEvents } from "../shared/lib/get-events.js";
import { fuzzySearch } from "../shared/lib/fuzzy-search-events.js";
import { escapeHtml, getGoogleDriveImagesPreview, eventToSchemaEventItem } from "../shared/lib/utils.js";

const OG_IMAGE_WIDTH = 1200;
let sheetId = typeof process !== "undefined" ? process.env?.GOOGLE_SHEET_ID : undefined;
let sheetGid = typeof process !== "undefined" ? process.env?.ALL_EVENTS_GOOGLE_SHEET_GID : undefined;

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.pathname.split("/").pop();
  const events = await getGoogleSheetEvents(sheetId, sheetGid);
  const searchResults = fuzzySearch(events, slug);
  const eventData = searchResults[0]?.item;

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

    let eventEntry = /*html*/ `
      <event-entry
        class="card"
        open=""
        data-title="${escapeHtml(eventData.title)}"
        data-description="${escapeHtml(eventData.description)}"
        data-starts-at="${eventData.startsAt}"
        data-ends-at="${eventData.endsAt}"
        data-locality="${eventData.locality}"
        data-instagram="${eventData.instagram}"
        data-location="${escapeHtml(eventData.location)}"
        data-phone="${eventData.phone}"
        data-images="${eventData.images}"
        data-activity="${eventData.activity}"
        data-spotify="${eventData.spotify}"
        data-youtube="${eventData.youtube}"
        data-slug="${eventData.slug}"
        data-tickets="${eventData.tickets}"
        data-form="${eventData.form}"
        data-link="${eventData.link}"
      ></event-entry>
    `;
    html = html.replace(
      /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/is,
      // "$<openTag>" + eventEntry + "$<closeTag>"
      () => `<event-entries>${eventEntry}</event-entries>`
    );
    html = html.replace(
      /(?<openTag><form[^>]*>).*?(?<closeTag><\/form>)/is,
      // "$<openTag>" + eventEntry + "$<closeTag>"
      () => ``
    );
    html = html.replace(/<div\s*slot="actions">[\s\S]*?<\/div>/i, "");
  }

  // Set cache headers based on event date
  // max-age: time in seconds the browser can cache the response
  // s-maxage: time in seconds the CDN can cache the response
  // stale-while-revalidate: time in seconds the CDN can serve a stale response while it revalidates it in the background

  // For past events: cache for a month (30 days) in CDN, 1 day in browser
  let cacheControl = "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400";
  if (eventData) {
    const eventDate = new Date(eventData.date);
    const now = new Date();
    if (eventDate > now) {
      // For future events: cache for 1 day in CDN, 1 hour in browser
      cacheControl = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600";
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
