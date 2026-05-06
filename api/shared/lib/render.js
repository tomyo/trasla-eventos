import {
  slugify,
  renderEventEntry,
  getEventSortOrder,
  makeCssToHideAbsentLocalitiesInFooter,
  eventsToSchemaOrgItemList,
  localityToSchemaOrgItem,
  isDateToday,
  isDateWithinWeek,
  isDateWithinMonth,
  escapeHtml,
  getGoogleDriveImagesPreview,
  eventToSchemaEventItem,
  OG_IMAGE_WIDTH,
  BASE_URL,
  getEventUrl,
  getLocalityUrl,
  getTimePageUrl,
} from "./utils.js";

/**
 * Render the Locality Page HTML
 */
export function renderLocalityPage(locality, events, templateHtml, origin) {
  const localitySlug = slugify(locality);
  const filteredEvents = events
    .filter((event) => slugify(event.locality) === localitySlug)
    .sort((a, b) => getEventSortOrder(a) - getEventSortOrder(b));

  const contentMeta = /*html*/ `
    <title>Próximos eventos en ${locality} | TRASLA EVENTOS</title>
    <link
      rel="canonical"
      property="og:url"
      href="${getLocalityUrl(locality, origin)}"
    />
    <meta property="og:title" content="Próximos eventos en ${locality}" />
    <meta
      name="description"
      property="og:description"
      content="¿Qué hacer en ${locality}? Información actualizada de todos los eventos en ${locality} de hoy y de la semana."
    />

    <meta
      property="og:image"
      content="${BASE_URL}/assets/images/og-image-1200w-900h.avif"
    />
    <meta property="og:image:type" content="image/avif" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="900" />
    <meta property="og:image" content="${BASE_URL}/assets/images/og-image-1200w-900h.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="900" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${getLocalityUrl(locality, origin)}" />

    <meta property="og:site_name" content="TRASLA EVENTOS" />
    <meta property="og:locale" content="es-AR" />

    <script type="application/ld+json">
      ${JSON.stringify(localityToSchemaOrgItem(locality, origin))}
    </script>
    ${
      filteredEvents.length
        ? /*html*/ `
          <script type="application/ld+json">
            ${JSON.stringify(eventsToSchemaOrgItemList(filteredEvents, origin))}
          </script>
        `
        : ""
    }

    <style>
      /* hide locality selector */
      events-filter form select-locality {
        display: none;
      }

      events-filter form span:has(~ select-locality) {
        display: none;
      }
    </style>
  `;

  let html = templateHtml;
  const contentMetaRegex = /<!-- START CONTENT_METADATA_BLOCK -->[\s\S]*?<!-- END CONTENT_METADATA_BLOCK -->/;
  html = html.replace(contentMetaRegex, contentMeta);

  html = html.replace(
    /<(?<tag>[a-z0-9-]+)\s*part="location"\s*>[\s\S]*?<\/.*?>/i,
    `<$<tag> part="location">${locality}</$<tag>>`,
  );
  html = html.replace(/<div\s*slot="actions">[\s\S]*?<\/div>/i, ""); // Hide actions i.e load event button

  // Reaplace seo-block with the locality name
  html = html.replace(
    /(?<openTag><seo-block>)[\s\S]*?(?<closeTag><\/seo-block>)/is,
    `$<openTag>
      <h2>¿Qué hacer en ${locality}?</h2>
      <p>Información actualizada de todos los eventos de ${locality} de hoy, de la semana y de este mes.</p>
    $<closeTag>`,
  );

  const eventEntries = filteredEvents.map((eventData) => renderEventEntry(eventData)).join("");

  html = html.replace(
    /(?<openTag><event-entries[^>]*>)[\s\S]*?(?<closeTag><\/event-entries>)/is,
    `$<openTag>${eventEntries}$<closeTag>`,
  );

  return html;
}

/**
 * Render the Time Page HTML (hoy, esta-semana, este-mes)
 */
export function renderTimePage(when, events, templateHtml, origin) {
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

  const canonicalUrl = getTimePageUrl(when, origin);

  const filteredEvents = events.filter(filter).sort((a, b) => getEventSortOrder(a) - getEventSortOrder(b));

  let html = templateHtml;

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
        content="${BASE_URL}/assets/images/og-image-1200w-900h.avif"
      />
      <meta property="og:image:type" content="image/avif" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="900" />
      <meta property="og:image" content="${BASE_URL}/assets/images/og-image-1200w-900h.jpg" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="900" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${canonicalUrl}" />

      <meta property="og:site_name" content="TRASLA EVENTOS" />
      <meta property="og:locale" content="es-AR" />

      <script type="application/ld+json">
        ${JSON.stringify(eventsToSchemaOrgItemList(filteredEvents, origin))}
      </script>
    `;

  const contentMetaRegex = /<!-- START CONTENT_METADATA_BLOCK -->[\s\S]*?<!-- END CONTENT_METADATA_BLOCK -->/;
  html = html.replace(contentMetaRegex, contentMeta);

  html = html.replace(/<div\s*slot="actions">[\s\S]*?<\/div>/i, ""); // Hide actions i.e load event button

  // Reaplace seo-block with the locality name
  html = html.replace(
    /(?<openTag><seo-block>)[\s\S]*?(?<closeTag><\/seo-block>)/gs,
    `$<openTag>
      <h2>¿Qué hacer en Traslasierra ${timeText}?</h2>
      <p>Información actualizada de todos los eventos, talleres, festivales y actividades de Traslasierra de ${timeText}.</p>
    $<closeTag>`,
  );

  const eventEntries = filteredEvents.map((eventData) => renderEventEntry(eventData)).join("");

  html = html.replace(
    /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/gs,
    `$<openTag>${eventEntries}$<closeTag>`,
  );

  html = html.replace(/(?<openTag><events-filter[^>]*)>/g, `$<openTag> data-hide="when">`);
  html = html.replace(
    /(?<openTag><span[^>]*where.*title.*>).*?(?<closeTag><\/span>)/,
    `<h1 style="text-align: center;">${title}<br>en</h1>`,
  );

  return html;
}

/**
 * Render the Event Page HTML
 */
export function renderEventPage(eventData, templateHtml, origin) {
  let html = templateHtml;

  if (eventData) {
    const previewImageUrl = getGoogleDriveImagesPreview(eventData.images, OG_IMAGE_WIDTH);
    const contentMeta = /*html*/ `
      <title>${escapeHtml(eventData.title)}</title>
      <link
        rel="canonical"
        property="og:url"
        href="${getEventUrl(eventData.slug, origin)}"
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
      <meta property="og:url" content="${getEventUrl(eventData.slug, origin)}" />
      <meta property="og:site_name" content="TRASLA EVENTOS" />
      <meta property="og:locale" content="es-AR" />
      <script type="application/ld+json">
        ${JSON.stringify({
          "@context": "https://schema.org",
          ...eventToSchemaEventItem(eventData, origin),
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
    html = html.replace(
      /(?<openTag><seo-block>)[\s\S]*?(?<closeTag><\/seo-block>)/is,
      () => `<seo-block>
        <h2>${eventData.title}</h2>
        <h3>En ${eventData.locality}</h3>
        <h3>El ${new Date(eventData.startsAt).toLocaleDateString("es-AR")}</h3>
        <p>${eventData.description}</p>
      </seo-block>`,
    );
  }

  return html;
}

/**
 * Render the Index Page HTML (Main Home Page)
 */
export function renderIndexPage(events, templateHtml, origin) {
  // 1. Sort events
  const upcomingEvents = events.sort((a, b) => getEventSortOrder(a) - getEventSortOrder(b));

  // 2. Take initial batch (e.g., first 20 events)
  const initialEvents = upcomingEvents.slice(0, 20);
  const eventEntriesHtml = initialEvents.map((eventData) => renderEventEntry(eventData)).join("");

  let html = templateHtml;

  // 3. Pre-render events in the HTML
  html = html.replace(
    /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/is,
    `$<openTag>${eventEntriesHtml}$<closeTag>`,
  );

  // 4. Pre-render JSON-LD
  const schemaEvents = eventsToSchemaOrgItemList(upcomingEvents, origin);

  // Inject a new script tag for the events schema inside the metadata block
  html = html.replace(
    /<!-- END CONTENT_METADATA_BLOCK -->/,
    `<script type="application/ld+json">
      ${JSON.stringify(schemaEvents)}
    </script>\n
    <!-- END CONTENT_METADATA_BLOCK -->`,
  );

  return html;
}
