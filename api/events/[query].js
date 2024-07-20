// api/event/[id].js
import { getSheetData } from "../shared/lib/get-gsheet-data.js";
import { fuzzySearch } from "../shared/lib/fuzzy-search-events.js";
import {
  getEventShareTitle,
  formatEventResponse,
} from "../shared/lib/utils.js";

export default async function handler(req) {
  const url = new URL(req.url);
  const query = url.pathname.split("/").pop();

  const events = await getSheetData();
  const searchResults = fuzzySearch(events, query);
  const eventData = formatEventResponse(searchResults[0].item);
  let html = await (await fetch(url.origin)).text();

  if (searchResults) {
    // Add meta tags for the first search result
    // Replace title
    html = html.replace(
      /<title>.*<\/title>/is,
      `<title>${getEventShareTitle(eventData)}</title>`
    );
    // Replace existing description
    html = html.replace(
      /<meta\s+name="description".*?>/is,
      `<meta name="description" content="${eventData.description}">`
    );

    const extraMetadata = /*html*/ `
        <!-- Open Graph Meta Tags -->
      <meta property="og:title" content="${getEventShareTitle(eventData)}" />
      <meta property="og:image" content="${eventData["image-url"]}" />
      <meta property="og:image:width" content="512" />
      <meta property="og:url" content="${url}" />
      <meta property="og:type" content="website" />

      <meta property="og:locale" content="es" />
      <meta property="og:description" content="${eventData.description}" />
    `;

    html = html.replace("</head>", `${extraMetadata}</head>`); // Expand head's meta tags

    let eventEntry = /*html*/ `
      <event-entry
        data-title="${eventData.title}"
        data-description="${eventData.description}"
        data-start-date="${eventData["start-date"]}"
        data-end-date="${eventData["end-date"]}"
        data-locality="${eventData.locality}"
        data-instagram="${eventData.instagram}"
        data-location="${eventData.location}"
        data-phone="${eventData.phone}"
        data-suggestion="${eventData.suggestion}"
        data-image-url="${eventData["image-url"]}"
      ></event-entry>
    `;

    html = html.replace(
      /(?<openTag><section\s+id="events"[^>]*>).*?(?<closeTag><\/section>)/is,
      "$<openTag>" + eventEntry + "$<closeTag>"
    );
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

export const config = {
  runtime: "edge",
};
