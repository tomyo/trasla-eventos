import {
  slugify,
  getEventSortOrder,
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
  parseDate,
  formatEventDate,
  getGoogleDriveImagesPreviews,
  formatPhoneNumber,
  isValidUrl,
  createGoogleCalendarUrl,
  formatShareTripUrl,
  formatDescription,
  formatLocalDate,
} from "./utils.js";

export function renderEventEntryInnerHtml(eventData, origin = BASE_URL, isFirstEvent = false) {
  const startDate = parseDate(eventData.startsAt);
  const eventTime = formatEventDate(startDate, { onlyTime: true, skipZeroTime: true });
  const previewImages = eventData.images.includes("google.com")
    ? getGoogleDriveImagesPreviews(eventData.images, 600)
    : eventData.images.split(",").map((url) => url.trim());

  const renderBadges = () => {
    let htmlString = "";
    if (eventData.activity) {
      htmlString += /*html*/ `<span data-type="${escapeHtml(eventData.activity)}">${escapeHtml(eventData.activity)}</span>`;
    }
    return htmlString;
  };

  const renderButtons = () => {
    let htmlString = "";

    // Add WhatsApp button
    if (eventData.phone) {
      const shareUrl = getEventUrl(eventData.slug, origin);
      let helloMsg = `${shareUrl}\n\nHola! 😃\nTe escribo por el ${eventData.activity?.toLowerCase()} ${eventData.title}:\n\n`;
      htmlString += /*html*/ `
        <a part="button" target="_blank" title="WhatsApp" href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
          eventData.phone,
        )}&text=${encodeURI(helloMsg)}">
          <img src="/assets/icons/whatsapp.svg" height="21" alt="WhatsApp"/>
        </a>
      `;
    }

    // Add Instagram button
    if (eventData.instagram) {
      htmlString += /*html*/ `
        <a part="button" target="_blank" title="Instagram" href="https://instagram.com/${escapeHtml(
          String(eventData.instagram).replace("@", ""),
        )}">
          <img src="/assets/icons/instagram.svg" height="21" alt="Instagram"/>
        </a>
      `;
    }

    // Add Google Maps button
    if (eventData.location) {
      let href = eventData.location;
      if (!isValidUrl(href))
        href = `https://www.google.com/maps/search/?api=1&query=${encodeURI(
          eventData.location + `, ${eventData.locality}, Córdoba, Argentina`,
        )},`;

      htmlString += /*html*/ `
        <a part="button" target="_blank" href=${href} title="¿Cómo llegar?">
          <img src="/assets/icons/maps.svg" height="25" alt=""/>
        </a>
      `;
    }

    // Add Youtube button
    if (eventData.youtube) {
      htmlString += /*html*/ `
        <a part="button" target="_blank" title="YouTube" href="${escapeHtml(eventData.youtube)}">
          <img height="21" src="/assets/icons/youtube.svg" alt=""/>
        </a>
      `;
    }

    // Add Spotify button
    if (eventData.spotify) {
      htmlString += /*html*/ `
        <a part="button" target="_blank" title="Spotify" href="${escapeHtml(eventData.spotify)}">
          <img src="/assets/icons/spotify.svg" height="21" alt=""/>
        </a>
      `;
    }

    // Add Tickets button
    if (eventData.tickets) {
      htmlString += /*html*/ `
        <a part="button" target="_blank" title="Conseguir Entradas" href="${escapeHtml(eventData.tickets)}">
          <img src="/assets/icons/ticket.svg" height="21" alt=""/>
        </a>
      `;
    }

    // Add Form button
    if (eventData.form) {
      htmlString += /*html*/ `
        <a part="button" target="_blank" title="Formulario" href="${escapeHtml(eventData.form)}">
          <img src="/assets/icons/form.svg" height="23" alt=""/>
        </a>
      `;
    }

    // Add Another link button
    if (eventData.link) {
      htmlString += /*html*/ `
        <a part="button" target="_blank" title="Link externo" href="${escapeHtml(eventData.link)}">
          <img src="/assets/icons/link.svg" height="21" alt=""/>
        </a>
      `;
    }

    // Add Google Calendar button
    htmlString += /*html*/ `
      <a target="_blank" part="button"  title="Agregar a tu Google Calendar"
          href="${createGoogleCalendarUrl({ dataset: eventData })}">
        <img src="/assets/icons/calendar.svg" height="21" alt="">
      </a>
    `;

    if (eventData.shareRideDestination) {
      // Add share-ride service button
      htmlString += /* html */ `
        <a target="_blank" part="button"  title="Buscar u ofrecer viaje compartido"
            href="${formatShareTripUrl(eventData)}">
          <img src="/assets/icons/car.svg" height="19" alt="">
        </a>
      `;
    }

    // Add Share button
    htmlString += /*html*/ `
      <share-url part="button" data-action="share" data-fallback-action="clipboard" data-text-success="Compartido"
                  data-text-success-fallback="Link copiado" data-url="${getEventUrl(eventData.slug, origin)}" data-title="${eventData.title}" 
                  title="Compartir este evento" data-utm-content="event-${eventData.slug.split("-").pop()}">
        <a href="${getEventUrl(eventData.slug, origin)}">
          <img src="/assets/icons/share.svg" height="21" alt="Compartir evento"/>
        </a>
      </share-url>
    `;

    return htmlString;
  };

  return /*html*/ `
    <h3 part="title">${escapeHtml(eventData.title)}</h3>
    <horizontal-carousel>
      ${previewImages.map((url, i) => `<img src="${escapeHtml(url)}" ${isFirstEvent && i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} alt="${escapeHtml(eventData.title)}">`).join("\n")}
    </horizontal-carousel>
    

    <h4 part="where-and-when">
      ${escapeHtml(eventData.locality)} ${eventTime ? ` - ${eventTime}` : ""}
    </h4>
    
    <div class="badges">
      ${renderBadges()}
    </div>

    <div part="buttons">
      ${renderButtons()}
    </div>

    ${
      eventData.description
        ? /*html*/ `
      <details>
        <p slot="description" part="description">${formatDescription(escapeHtml(eventData.description))}</p>
        <summary>
          Ver <span class="more">más</span><span class="less">menos</span>
        </summary>
      </details>`
        : ""
    }
  `;
}

export function renderEventEntry(eventData, origin = BASE_URL, isFirstEvent = false) {
  return /*html*/ `
    <event-entry
      class="card"
      data-title="${escapeHtml(eventData.title)}"
      data-starts-at="${escapeHtml(eventData.startsAt)}"
      data-locality="${escapeHtml(eventData.locality)}"
      data-activity="${escapeHtml(eventData.activity)}"
      data-slug="${escapeHtml(eventData.slug)}"
      date="${formatLocalDate(new Date(eventData.startsAt))}"
    >
      ${renderEventEntryInnerHtml(eventData, origin, isFirstEvent)}
    </event-entry>`;
}

export function renderEventEntries(events, origin = BASE_URL) {
  return events.map((eventData, i) => renderEventEntry(eventData, origin, i === 0)).join("");
}

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
      /* hide form locality selector */
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
    (_, tag) => `<${tag} part="location">${locality}</${tag}>`,
  );
  html = html.replace(/<div\s*slot="actions">[\s\S]*?<\/div>/i, ""); // Hide actions i.e load event button

  // Reaplace seo-block with the locality name
  html = html.replace(
    /(?<openTag><seo-block>)[\s\S]*?(?<closeTag><\/seo-block>)/is,
    (_, openTag, closeTag) => `${openTag}
      <h2>¿Qué hacer en ${locality}?</h2>
      <p>Información actualizada de todos los eventos de ${locality} de hoy, de la semana y de este mes.</p>
    ${closeTag}`,
  );

  const eventEntries = renderEventEntries(filteredEvents, origin);

  html = html.replace(
    /(?<openTag><event-entries[^>]*>)[\s\S]*?(?<closeTag><\/event-entries>)/is,
    (_, openTag, closeTag) => `${openTag}${eventEntries}${closeTag}`,
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
    (_, openTag, closeTag) => `${openTag}
      <h2>¿Qué hacer en Traslasierra ${timeText}?</h2>
      <p>Información actualizada de todos los eventos, talleres, festivales y actividades de Traslasierra de ${timeText}.</p>
    ${closeTag}`,
  );

  const eventEntries = renderEventEntries(filteredEvents, origin);

  html = html.replace(
    /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/gs,
    (_, openTag, closeTag) => `${openTag}${eventEntries}${closeTag}`,
  );

  html = html.replace(/(?<openTag><events-filter[^>]*)>/g, (_, openTag) => `${openTag} data-hide="when">`);
  html = html.replace(
    /(?<openTag><span[^>]*where.*title.*>).*?(?<closeTag><\/span>)/,
    () => `<h1 style="text-align: center;">${title}<br>en</h1>`,
  );

  return html;
}

/**
 * Render the Event Page HTML
 */
export function renderEventPage(eventData, templateHtml, origin) {
  let html = templateHtml;

  if (eventData) {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const isPastEvent = new Date(eventData.startsAt) < todayMidnight;
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

    const eventEntry = renderEventEntry(eventData, origin, true);
    const pastEventMessage = isPastEvent ? "\n<p>Evento finalizado</p>" : "";

    html = html.replace(
      /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/is,
      (_, openTag, closeTag) => `${openTag}${eventEntry}${closeTag}${pastEventMessage}`,
    );
    html = html.replace(/(?<openTag><form[^>]*>).*?(?<closeTag><\/form>)/is, () => ``);
    html = html.replace(/<div\s*slot="actions">[\s\S]*?<\/div>/i, "");
    html = html.replace(
      /(?<openTag><seo-block>)[\s\S]*?(?<closeTag><\/seo-block>)/is,
      (_, openTag, closeTag) => `${openTag}
        <h2>${eventData.title}</h2>
        <h3>En ${eventData.locality}</h3>
        <h3>El ${new Date(eventData.startsAt).toLocaleDateString("es-AR")}</h3>
        <p>${eventData.description}</p>
      ${closeTag}`,
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

  const eventEntriesHtml = renderEventEntries(upcomingEvents, origin);

  let html = templateHtml;

  // 3. Pre-render events in the HTML
  html = html.replace(
    /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/is,
    (_, openTag, closeTag) => `${openTag}${eventEntriesHtml}${closeTag}`,
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
