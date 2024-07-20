export function getEventShareTitle(eventData) {
  return (
    eventData.title ||
    `Evento en ${eventData.locality} el ${formatDate(
      new Date(eventData["start-date"])
    )}`
  );
}

/**
 * 
 * @param {String} imageId 
 * @returns {String} an image url from a google drive file link
 
 */
export function createGoogleDriveImageUrl(imageId, width = 512) {
  //
  return `https://drive.google.com/thumbnail?id=${imageId}&sz=w${width}`;
}

/**
 *
 * @param {String} urls, a string containing google drive links separated by commas
 * @returns {String} id of the last google drive link provided
 */
export function getFileIdFromDriveUrls(urls) {
  const imageIdRegexp = /id=([\d\w-]*)/gm;
  const imageIdMatch = imageIdRegexp.exec(urls);
  return imageIdMatch && imageIdMatch.pop(); // Get the last match
}

/**
 *
 * @param {EventResponse} event
 * @returns {EventData} A event object with formatted content and keys renamed in English in Kebab Case
 */
export function formatEventResponse(eventResponse) {
  const event = {};

  event["start-date"] = parseEventResponseDateString(
    eventResponse["Comienzo"]
  ).toISOString();
  event["end-date"] = eventResponse["Cierre"]
    ? parseEventResponseDateString(eventResponse["Cierre"]).toISOString()
    : "";
  event["id"] = getFileIdFromDriveUrls(eventResponse["Imagen"]);
  event["image-url"] = createGoogleDriveImageUrl(event["id"]);
  event["title"] = eventResponse["Título"] || "";
  event["locality"] = eventResponse["Localidad"] || "";
  event["instagram"] = eventResponse["Instagram"] || "";
  event["location"] = eventResponse["Ubicación"] || "";
  event["phone"] = eventResponse["Teléfono de contacto"] || "";
  event["suggestion"] = eventResponse["Sugerencia"] || "";
  event["description"] = eventResponse["Descripción"];

  return event;
}

/**
 *
 * @param {String} description
 * @returns {String} sanitized and formated description ready to be inserted in html
 */
export function formatDescription(description) {
  // Replace URLs in the content with proper anchor tags
  if (!description) return "";

  let result = description;

  const urlRegex =
    /(\b(?:https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

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
    return `<a href="https://instagram.com/${match.slice(
      1
    )}" target="_blank">${match}</a>`;
  });

  return result;
}

/**
 *
 * @param {String} dateString
 * @returns {Date|null}
 *
 * Format expected: "dd/mm/yyyy hh:mm:ss"
 */
export function parseEventResponseDateString(dateString) {
  try {
    const [date, time] = dateString.split(" ");
    const [day, month, year] = date.split("/");
    const [hour, minute] = time.split(":");
    return new Date(year, month - 1, day, hour, minute);
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

/**
 *
 * @param {Date} date
 * @returns {boolean} True if the date is today.
 */
export function isDateToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function formatDateString(dateString) {
  if (!dateString) return "";
  return dateString
    .replace(/:00$/, "h") // Remove seconds
    .replace(/^(.*\/.*\/)\d\d(\d\d)/, "$1$2 -"); // Remove century
}

/**
 *
 * @param {Date} date
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
    try {
      new URL(`http://${string}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 *
 * @param {EventEntry} eventElement
 * @returns {String} A google calendar url to create an event
 */
export function createGoogleCalendarUrl(eventElement) {
  const hook = "Más información en https://eventos.trasla.com.ar\n\n";
  const eventTitle = `${eventElement.dataset.title || "Evento"} en ${
    eventElement.dataset.locality
  }`;

  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const encodedDetails = encodeURIComponent(
    hook + eventElement.dataset.description || ""
  );
  const encodedLocation = encodeURIComponent(
    eventElement.dataset.location || ""
  );
  const encodedSummary = encodeURIComponent(
    "Evento en " + eventElement.dataset.locality
  );

  let url = `${baseUrl}&text=${encodedSummary}&details=${encodedDetails}&location=${encodedLocation}`;
  const startDateString = eventElement.startDate
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, "");

  // Default event duration is 2 hours if end time is not provided.
  let endDate = eventElement.endDate
    ? eventElement.endDate
    : new Date(eventElement.startDate.getTime() + 2 * 60 * 60 * 1000);

  const endDateString = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  url += `&dates=${startDateString}/${endDateString}`;
  return url;
}

export function slugify(text) {
  const from = "àáäâãåçèéêëìíîïñòóôöõùúûüýÿ";
  const to = "aaaaaaceeeeiiiinooooouuuuyy";

  // Create a map of accented characters to their replacements
  const map = {};
  for (let i = 0; i < from.length; i++) {
    map[from.charAt(i)] = to.charAt(i);
  }

  // Replace accented characters and other necessary replacements
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-/]/g, (char) => map[char] || "") // Replace non-ASCII chars with mapped chars or remove
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/\//g, "-") // Replace slashes with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens

  return slug;
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
    .replace(/'/g, "&#039;");
}

/**
 *
 * @param {String} escapedText
 * @returns
 */
export function unescapeHtml(escapedText) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = escapedText;
  return textarea.value;
}

// Encode function to safely store data in dataset
export function encodeForDataset(data) {
  // Convert data to JSON string
  const jsonString = JSON.stringify(data);
  // Encode the JSON string to base64
  return btoa(encodeURIComponent(jsonString));
}

// Decode function to retrieve data from dataset
export function decodeFromDataset(encodedData) {
  try {
    // Decode from base64 and parse JSON
    const jsonString = decodeURIComponent(atob(encodedData));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error decoding data:", error);
    return null;
  }
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