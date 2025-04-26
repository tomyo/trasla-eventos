export const OG_IMAGE_WIDTH = 1200;

/**
 *
 * @param {String} description - text to format, html scaped.
 * @returns {String} sanitized and formated description ready to be inserted in html
 */
export function formatDescription(description) {
  // Replace URLs in the content with proper anchor tags
  if (!description) return "";

  let result = unescapeHtml(description);

  const urlRegex = /(\b(?:(?:(?:https?|ftp):\/\/)|www\.)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

  result = result.replace(urlRegex, (match) => {
    match = match.trim().toLowerCase();
    // Check if the URL already has a missing protocol prefix
    if (!match.startsWith("http")) match = `https://${match}`;

    let url = new URL(match);
    // Remove the query parameters from the visual text
    url.search = "";
    return `<a href="${match}" target="_blank">${url.hostname + url.pathname}</a>`;
  });

  // Replace new lines with <br> tags
  result = result.replace(/\n/g, "<br>");

  // Replace phone numbers with WhatsApp links
  const phoneRegex = /\+?(\d[\s\-\d]{10,20})\b/g;
  result = result.replace(phoneRegex, (match) => {
    return `<a href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(match)}" target="_blank">${match}</a>`;
  });

  // Replace Instagram handles with links
  const instagramRegex = /@([a-zA-Z0-9_.]{1,30})/g;
  result = result.replace(instagramRegex, (match) => {
    return `<a href="https://instagram.com/${match.slice(1)}" target="_blank">${match}</a>`;
  });

  return applyWhatsAppFormatting(result);
}

/**
 *
 * @param {String} waText
 * @returns
 */
function applyWhatsAppFormatting(waText) {
  // Replace *bold* with <b>bold</b>
  waText = waText.replace(/\*(.*?)\*/g, "<b>$1</b>");

  // Replace _italic_ with <i>italic</i>
  waText = waText.replace(/_(.*?)_/g, "<i>$1</i>");

  // Replace ~strikethrough~ with <s>strikethrough</s>
  waText = waText.replace(/~(.*?)~/g, "<s>$1</s>");

  // Replace `code` with <code>code</code>
  waText = waText.replace(/`(.*?)`/g, "<code>$1</code>");

  return waText;
}

/**
 *
 * @param {Date} dateOrString - A Date object or a date string in yyyy-mm-dd format.
 * @returns {boolean} True if the date is today.
 */
export function isDateToday(dateOrString) {
  if (!dateOrString) return false;
  const now = new Date();
  let date = new Date(dateOrString);

  if (typeof dateOrString === "string") {
    const [year, month, day] = dateOrString.split("-");
    date = new Date(year, month - 1, day);
  }

  return (
    date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  );
}

export function isDateTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

export function isDateWithinWeek(dateToCheck, referenceDate = new Date()) {
  dateToCheck = new Date(dateToCheck);
  referenceDate = new Date(referenceDate);

  dateToCheck.setHours(0, 0, 0, 0);
  referenceDate.setHours(0, 0, 0, 0);

  const diffTime = dateToCheck.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 6;
}

export function formatDateString(dateString) {
  if (!dateString) return "";
  return dateString
    .replace(/:00$/, "h") // Remove seconds
    .replace(/^(.*\/.*\/)\d\d(\d\d)/, "$1$2 -"); // Remove century
}

/**
 *
 * @param {Date} date - A Date object to read time from
 * @returns {String} [dd]/[mm]/[yy] - [hh]:[mm]h
 */
export function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} - ${hour}:${minute}h`;
}

export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string and returns a Date object if valid, or null if invalid.
 * @param {string} dateString - The date string to parse.
 * @returns {Date|null} The Date object if valid, or null if invalid.
 */
export function parseDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Adds a specified number of hours to a given date.
 *
 * @param {Date} date - The original date to which the offset will be added.
 * @param {number} [offsetInHours=2] - The number of hours to add to the date. Defaults to 2 hours if not provided.
 * @returns {Date} A new Date object with the specified number of hours added.
 */
export function addHoursOffsetToDate(date, offsetInHours = 2) {
  const twoHoursInMilliseconds = offsetInHours * 60 * 60 * 1000;
  return new Date(new Date(date).getTime() + twoHoursInMilliseconds);
}

export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "";
  phoneNumber = phoneNumber.replace(/[^\d+]/g, "");
  return phoneNumber?.startsWith("+") ? phoneNumber : `+54${phoneNumber}`;
}

export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 *
 * @param {EventEntry} eventElement
 * @returns {String} A google calendar url to create an event
 */
export function createGoogleCalendarUrl(eventElement) {
  const hook = `https://eventos.trasla.com.ar/${eventElement.slug}\n\n`;
  let eventTitle = eventElement.dataset.title;
  if (!eventTitle) {
    eventTitle = `Actividad en ${eventElement.dataset.locality}`;
  }
  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const encodedDetails = encodeURIComponent(hook + eventElement.dataset.description || "");
  const encodedLocation = encodeURIComponent(eventElement.dataset.location || "");
  const encodedSummary = encodeURIComponent(eventTitle);

  let url = `${baseUrl}&text=${encodedSummary}&details=${encodedDetails}&location=${encodedLocation}`;
  const startDateString = eventElement.dataset.startsAt.replace(/-|:|\.\d\d\d/g, "");
  let endDateString = eventElement.dataset.endsAt;
  if (!endDateString && eventElement.dataset.startsAt) {
    // Default event duration is 2 hours if end time is not provided.
    endDateString = addHoursOffsetToDate(new Date(eventElement.dataset.startsAt), 2).toISOString();
  }

  endDateString = endDateString.replace(/-|:|\.\d\d\d/g, "");
  url += `&dates=${startDateString}/${endDateString}`;
  return url;
}

/**
 *
 * @param {String} text
 * @returns {String} text without accents (ie.  á -> a)
 */
function unaccent(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function slugify(text) {
  if (!text) return "";

  // Replace accented characters and other necessary replacements
  return unaccent(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-/]/g, "") // Remove non-ASCII chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/\//g, "-") // Replace slashes with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

export function unslugify(slug) {
  slug = slug.replace(/-(\d\d?)-(\d\d?)-(\d\d)-/g, " $1/$2/20$3 "); // guess date
  slug = slug.replace(/(\d\d?)(\d\d?)h/g, " $1:$2 "); // guess time
  return slug.replace(/-/g, " ");
}

/**
 *
 * @param {String} unsafeText
 * @returns sanitized text ready to be inserted in html
 */
export function escapeHtml(unsafeText) {
  if (!unsafeText) return "";
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 *
 * @param {String} escapedText
 * @returns {String} unescaped text ready to be inserted in html
 */
export function unescapeHtml(escapedText) {
  if (!escapedText) return "";

  // Handle common HTML entities using a lookup table
  const entityReplacements = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };

  // First pass: Replace known entities
  let unescaped = escapedText.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (match) => entityReplacements[match]);

  // Second pass: Handle numeric entities (decimal and hex)
  unescaped = unescaped.replace(/&#(x)?([0-9a-f]+);/gi, (_, isHex, code) =>
    String.fromCodePoint(parseInt(code, isHex ? 16 : 10))
  );

  return unescaped;
}

/**
 * 
 * @param {String} imageId 
 * @param {Number} width in pixels
 * @returns {String} Image url from a google drive to use in <img>
 
 */
function createGoogleDriveImageUrl(imageId, width = OG_IMAGE_WIDTH) {
  return `https://drive.google.com/thumbnail?sz=w${width}&id=${imageId}`;
}

/**
 *
 * @param {String} urls, a string containing google drive links separated by commas
 * @returns {String} id of the last google drive link provided
 */
function getLastFileIdFromDriveUrls(urls) {
  const imageIdRegexp = /id=([\d\w-]*)/gm;
  const ids = Array.from(urls.matchAll(imageIdRegexp), (m) => m[1]);
  return ids.pop(); // Get the last match
}

/**
 *
 * @param {String} imageUrls A comma separated list of google drive urls
 * @returns {String} preview image url for the last file on the list
 * @returns
 */
export function getGoogleDriveImagesPreview(imageUrls, width = OG_IMAGE_WIDTH) {
  return createGoogleDriveImageUrl(getLastFileIdFromDriveUrls(imageUrls), width);
}

/**
 * Converts an array of event objects into a Schema.org ItemList format.
 *
 * @param {Array} events - An array of event objects to be converted.
 * @returns {Object} A Schema.org ItemList object representing the events.
 */
export function eventsToSchemaOrgItemList(events, origin = "https://eventos.trasla.com.ar") {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: eventToSchemaEventItem(event, origin),
    })),
  };

  return schema;
}

/**
 * Converts a single event object into a Schema.org ItemList format.
 * More info at https://developers.google.com/search/docs/appearance/structured-data/event
 *
 * @param {Object} event - The event object to be converted.
 * @param {string} [origin="https://eventos.trasla.com.ar"] - The base URL for the event.
 * @returns {Object} A Schema.org ItemList object representing the event.
 */
export function eventToSchemaEventItem(event, origin = "https://eventos.trasla.com.ar") {
  const schema = {
    "@type": "Event",
    name: escapeHtml(event.title),
    description: escapeHtml(event.description),
    image: getGoogleDriveImagesPreview(event.images, OG_IMAGE_WIDTH),
    startDate: event.startsAt,
    endDate: event.endsAt || addHoursOffsetToDate(new Date(event.startsAt), 2).toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      ...(event.place && { name: event.place }),
      address: event.address || `${event.locality}, Córdoba, Argentina`,
      url: event.location,
    },
    eventStatus: "https://schema.org/EventScheduled", // EventPostponed / EventRescheduled
    url: `${origin}/${event.slug}`,
  };

  return schema;
}
