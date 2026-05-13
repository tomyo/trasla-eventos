import {
  escapeHtml,
  BASE_URL,
  getEventUrl,
  parseDate,
  formatEventDate,
  getGoogleDriveImagesPreviews,
  formatPhoneNumber,
  isValidUrl,
  createGoogleCalendarUrl,
  formatShareTripUrl,
  formatDescription,
  formatLocalDate,
} from "../../lib/utils.js";

export function renderEventEntryContent(eventData, origin = BASE_URL, isFirstEvent = false) {
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
      ${renderEventEntryContent(eventData, origin, isFirstEvent)}
    </event-entry>`;
}

