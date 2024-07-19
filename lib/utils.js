export function getEventShareTitle(event) {
  return (
    event["Título"] ||
    `Evento en ${event["Localidad"]} el ${formatDateString(event["Comienzo"])}`
  );
}

/**
 * 
 * @param {EventData} event 
 * @returns {String} A url pointing the image of the event
 
 */
export function generateImageUrl(event, width = 512) {
  // Provide a image_url from a google drive link
  const fileId = getFileIdFromDriveUrls(event["Imagen"]);
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

/**
 *
 * @param {String} urls, a string containing google drive links.
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
 * @returns {EventData} A event object with additional properties and formatted content
 */
export function enhanceEvent(event) {
  // Add start/end Date objects
  event.startDate = parseDateString(event["Comienzo"]);
  event.endDate = event["Cierre"] ? parseDateString(event["Cierre"]) : null;
  event.id = getFileIdFromDriveUrls(event["Imagen"]);
  event.imageUrl = generateImageUrl(event);

  if (event["Descripción"]) {
    // Replace URLs in the content with proper anchor tags
    const urlRegex =
      /(\b(?:https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

    event["Descripción"] = event["Descripción"].replace(urlRegex, (match) => {
      let url = new URL(match);
      // Remove the query parameters from the visual text
      url.search = "";
      return `<a href="${match}" target="_blank">${url.href}</a>`;
    });

    // Replace new lines with <br> tags
    event["Descripción"] = event["Descripción"].replace(/\n/g, "<br>");

    // Replace phone numbers with WhatsApp links
    const phoneRegex = /(\+?\d{2,3})?(\d{10})/g;
    event["Descripción"] = event["Descripción"].replace(phoneRegex, (match) => {
      return `<a href="https://api.whatsapp.com/send?phone=${formatPhoneNumber(
        match
      )}" target="_blank">${match}</a>`;
    });

    // Replace Instagram handles with links
    const instagramRegex = /@([a-zA-Z0-9_.]{1,30})/g;
    event["Descripción"] = event["Descripción"].replace(
      instagramRegex,
      (match) => {
        return `<a href="https://instagram.com/${match.slice(
          1
        )}" target="_blank">${match}</a>`;
      }
    );
  }

  return event;
}

/**
 *
 * @param {String} dateString
 * @returns {Date}
 *
 * Format expected: "dd/mm/yyyy hh:mm:ss"
 */
export function parseDateString(dateString) {
  const [date, time] = dateString.split(" ");
  const [day, month, year] = date.split("/");
  const [hour, minute] = time.split(":");
  return new Date(year, month - 1, day, hour, minute);
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
 * @param {EventData} event
 * @returns
 */
export function createGoogleCalendarUrl(event) {
  const hook = "Más información en https://eventos.trasla.com.ar\n\n";
  const eventTitle = `${event["Título"] || "Evento"} en ${event["Localidad"]}`;

  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const encodedDetails = encodeURIComponent(hook + event["Descripción"] || "");
  const encodedLocation = encodeURIComponent(event["Ubicación"] || "");
  const encodedSummary = encodeURIComponent("Evento en " + event["Localidad"]);

  let url = `${baseUrl}&text=${encodedSummary}&details=${encodedDetails}&location=${encodedLocation}`;
  const startDate = parseDateString(event["Comienzo"]);
  const startDateString = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

  // Default event duration is 2 hours if end time is not provided.
  let endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  if (event["Cierre"]) endDate = parseDateString(event["Cierre"]);
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
