import { getGoogleSheetEvents } from "../../shared/lib/get-events.js";
import {
  isDateToday,
  isDateWithinWeek,
  isDateWithinMonth,
  escapeHtml,
  getEventSortOrder,
  eventsToSchemaOrgItemList,
} from "../../shared/lib/utils.js";

let sheetId = typeof process !== "undefined" ? process.env?.GOOGLE_SHEET_ID : undefined;
let sheetGid = typeof process !== "undefined" ? process.env?.ALL_EVENTS_GOOGLE_SHEET_GID : undefined;

export default async function handler(req) {
  const url = new URL(req.url);
  const when = url.searchParams.get("when");
  const events = await getGoogleSheetEvents(sheetId, sheetGid);
  let filter = (event) => true;
  let title;
  let description;
  let timeText;
  if (when === "hoy") {
    filter = (event) => isDateToday(new Date(event.startsAt));
    title = "Eventos de hoy";
    timeText = "hoy";
    description = "Información actualizada de todos los eventos de hoy en Traslasierra.";
  } else if (when === "esta-semana") {
    filter = (event) => isDateWithinWeek(new Date(event.startsAt));
    title = "Eventos de esta semana";
    timeText = "esta semana";
    description = "Información actualizada de todos los eventos de esta semana en Traslasierra.";
  } else if (when === "este-mes") {
    filter = (event) => isDateWithinMonth(new Date(event.startsAt));
    title = "Eventos de este mes";
    timeText = "este mes";
    description = "Información actualizada de todos los eventos de este mes en Traslasierra.";
  } else {
    throw new Error("Invalid when parameter: " + when);
  }

  const canonicalUrl = `${url.origin}/eventos-${when}/`; // Standardized canonical url

  const filteredEvents = events.filter(filter).sort((a, b) => getEventSortOrder(a) - getEventSortOrder(b));

  let html = await (await fetch(`${url.origin}/index.html`)).text();

  const contentMeta = /*html*/ `
      <title>${title} | TRASLA EVENTOS</title>
      <link
        rel="canonical"
        property="og:url"
        href="${canonicalUrl}"
      />
      <meta property="og:title" content="${title}" />
      <meta
        name="description"
        property="og:description"
        content="${description}"
      />

      <meta
        property="og:image"
        content="https://eventos.trasla.com.ar/assets/images/og-image-1200w-900h.avif"
      />
      <meta property="og:image:type" content="image/avif" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="900" />
      <meta property="og:image" content="https://eventos.trasla.com.ar/assets/images/og-image-1200w-900h.jpg" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="900" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${canonicalUrl}" />

      <meta property="og:site_name" content="TRASLA EVENTOS" />
      <meta property="og:locale" content="es-AR" />

      <script type="application/ld+json">
        ${JSON.stringify(eventsToSchemaOrgItemList(filteredEvents, url.origin))}
      </script>
    `;

  const contentMetaRegex = /<!-- START CONTENT_METADATA_BLOCK -->[\s\S]*?<!-- END CONTENT_METADATA_BLOCK -->/;
  html = html.replace(contentMetaRegex, contentMeta);

  html = html.replace(/<div\s*slot="actions">[\s\S]*?<\/div>/i, ""); // Hide actions i.e load event button

  // Reaplace seo-block with the locality name
  html = html.replace(
    /(?<openTag><seo-block>).*?(?<closeTag><\/seo-block>)/gs,
    `$<openTag>
      <h2>¿Qué hacer en Traslasierra ${timeText}?</h2>
      <p>Información actualizada de todos los eventos de Traslasierra de ${timeText}.</p>
    $<closeTag>`
  );

  const eventEntries = filteredEvents
    .map(
      (eventData) => /*html*/ `
        <event-entry
          class="card"
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
        ></event-entry>`
    )
    .join("");

  html = html.replace(
    /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/gs,
    `$<openTag>${eventEntries}$<closeTag>`
  );

  html = html.replace(
    /(?<openTag><form[^>]*>).*?(?<closeTag><\/form>)/gs,
    `<h1 style="text-align: center;">${title}</h1>`
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=30" },
  });
}

export const config = {
  runtime: "edge",
};
