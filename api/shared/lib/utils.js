export function getEventShareTitle(eventData) {
  return `${eventData.title} en ${eventData.locality} el ${formatDate(new Date(eventData["start-date"]))}`;
}

/**
 *
 * @param {eventData}
 * @returns {String} slug for the event
 */
export function getEventSlug({ title, locality, startDate }) {
  return slugify(unescapeHtml(title + " " + locality + " " + formatDate(startDate)));
}

/**
 * 
 * @param {String} imageId 
 * @param {Number} width in pixels
 * @returns {String} Image url from a google drive to use in <img>
 
 */
export function createGoogleDriveImageUrl(imageId, width = 512) {
  return `https://lh3.googleusercontent.com/d/${imageId}=w${width}`;
}

/**
 *
 * @param {String} urls, a string containing google drive links separated by commas
 * @returns {String} id of the last google drive link provided
 */
export function getFileIdFromDriveUrls(urls) {
  const imageIdRegexp = /id=([\d\w-]*)/gm;
  const ids = Array.from(urls.matchAll(imageIdRegexp), (m) => m[1]);
  return ids.pop(); // Get the last match
}

function createCamelCaseProxy(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      // If the property exists directly, return it
      if (prop in target) {
        return target[prop];
      }

      // Convert camelCase to kebab-case and try to find it
      const kebabProp = prop.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      if (kebabProp in target) {
        return target[kebabProp];
      }

      return undefined;
    },
  });
}

/**
 *
 * @param {EventResponse} event
 * @returns {EventData} A event object with formatted content and keys renamed in English in kebab-case
 *
 * kebab-case is used to allow easy adding them as data-<attributes>
 */
export function formatEventResponse(eventResponse) {
  const event = createCamelCaseProxy({});

  event["start-date"] = parseEventResponseDateString(eventResponse["Comienzo"]).toISOString();
  event["end-date"] = eventResponse["Cierre"]
    ? parseEventResponseDateString(eventResponse["Cierre"])?.toISOString()
    : "";
  event["id"] = getFileIdFromDriveUrls(eventResponse["Imagen"]);
  event["image-url"] = createGoogleDriveImageUrl(event["id"]);
  event["title"] = eventResponse["Título"] || "";
  event["locality"] = eventResponse["Localidad"] || "";
  event["instagram"] = eventResponse["Instagram"] || "";
  event["location"] = eventResponse["Ubicación"] || "";
  event["phone"] = eventResponse["Teléfono de contacto"] || "";
  event["suggestion"] = eventResponse["Sugerencia"] || "";
  event["description"] = eventResponse["Descripción"] || "";
  event["activity"] = eventResponse["Actividad"] || "";
  event["spotify"] = eventResponse["Spotify"] || "";
  event["youtube"] = eventResponse["YouTube"] || "";

  // Generated fields
  event["slug"] = eventResponse["slug"] || getEventSlug(event);

  return event;
}

/**
 *
 * @param {String} description - text to format, html scaped.
 * @returns {String} sanitized and formated description ready to be inserted in html
 */
export function formatDescription(description) {
  // Replace URLs in the content with proper anchor tags
  if (!description) return "";

  let result = unescapeHtml(description);

  const urlRegex = /(\b(?:https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

  result = result.replace(urlRegex, (match) => {
    let url = new URL(match);
    // Remove the query parameters from the visual text
    url.search = "";
    return `<a href="${match}" target="_blank">${url.href}</a>`;
  });

  // Replace new lines with <br> tags
  result = result.replace(/\n/g, "<br>");

  // Replace phone numbers with WhatsApp links
  const phoneRegex = /(\+?\d{2,3})?(\d{10})/g;
  result = result.replace(phoneRegex, (match) => {
    return `<a href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
      match
    )}" target="_blank">${match}</a>`;
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
 * @param {String} dateString as formated by gsheet es-AR locale
 * @param {Number} timezone, offset in hours from UTC
 *
 * @returns {Date|null} UTC Date object
 *
 * Format expected: "dd/mm/yyyy hh:mm:ss"
 */
export function parseEventResponseDateString(dateString, timezone = -3) {
  try {
    const [date, time] = dateString.split(" ");
    const [day, month, year] = date.split("/");
    const [hour, minute] = time.split(":");

    // Create a local timezone Date object, interpreting the response as UTC
    const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    // Substract the utc offset, we do it this way to avoid hours overflow
    return new Date(localDate.setUTCHours(localDate.getUTCHours() - timezone));
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
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
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
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
 * @param {Date} date - A Date object to read UTC time from
 * @returns {String} [dd]/[mm]/[yy] - [hh]:[mm]h
 */
export function formatDate(date, timezone = -3) {
  // Fix to display timezone
  const targetUtcDate = new Date(date);
  targetUtcDate.setUTCHours(targetUtcDate.getUTCHours() + timezone);

  const day = targetUtcDate.getUTCDate().toString().padStart(2, "0");
  const month = (targetUtcDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = targetUtcDate.getUTCFullYear().toString().slice(-2);
  const hour = targetUtcDate.getUTCHours().toString().padStart(2, "0");
  const minute = targetUtcDate.getUTCMinutes().toString().padStart(2, "0");
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
  const startDateString = eventElement.startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

  // Default event duration is 2 hours if end time is not provided.
  let endDate = eventElement.endDate
    ? eventElement.endDate
    : new Date(eventElement.startDate.getTime() + 2 * 60 * 60 * 1000);

  const endDateString = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
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
  let unescaped = escapedText.replace(
    /&(amp|lt|gt|quot|#39|apos|nbsp);/g,
    (match) => entityReplacements[match]
  );

  // Second pass: Handle numeric entities (decimal and hex)
  unescaped = unescaped.replace(/&#(x)?([0-9a-f]+);/gi, (_, isHex, code) =>
    String.fromCodePoint(parseInt(code, isHex ? 16 : 10))
  );

  return unescaped;
}
