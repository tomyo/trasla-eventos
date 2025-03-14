import { getSheetData } from "../shared/lib/get-gsheet-data.js";
import { fuzzySearch } from "../shared/lib/fuzzy-search-events.js";
import { getEventShareTitle, escapeHtml, formatLocalDate } from "../shared/lib/utils.js";

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.pathname.split("/").pop();
  const events = await getSheetData({ includePastEvents: true });
  const searchResults = fuzzySearch(events, slug);
  const eventData = searchResults[0]?.item;

  let html = await (await fetch(`${url.origin}/index.html`)).text();

  if (eventData) {
    const contentMeta = /*html*/ `
      <title property="og:title">${escapeHtml(getEventShareTitle(eventData))}</title>
      <link
        rel="canonical"
        property="og:url"
        href="${url.origin}/${eventData.slug}"
      />
      <meta
        name="description"
        property="og:description"
        content="${escapeHtml(eventData.description)}"
      />
      <meta property="og:image" content="${eventData["image-url"]}" />
      <meta property="og:image:width" content="512" />
      <meta property="og:type" content="event" />
      <meta property="og:url" content="${url.origin}/${eventData.slug}" />

      <meta property="og:site_name" content="EVENTOS.TRASLA" />
      <meta property="og:locale" content="es-AR" />
      <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": "${eventData.title}",
            "description": "${eventData.description}",
            "image": "${eventData["image-url"]}",
            "startDate": "${eventData.startDate}",
            "endDate": "${eventData.endDate}",
            "location": {
              "@type": "Place",
              "name": "${eventData.locality}",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "${eventData.locality}"
              },
              "url": "${eventData.location}"
            },
            "organizer": {
              "telephone": "${eventData.phone}",
              "instagram": "${eventData.instagram}"
            },
            "url": "${url.origin}/${eventData.slug}"
          }
          </script>
    `;

    const contentMetaRegex =
      /<!-- START CONTENT_METADATA_BLOCK -->[\s\S]*?<!-- END CONTENT_METADATA_BLOCK -->/;
    html = html.replace(contentMetaRegex, contentMeta);

    let eventEntry = /*html*/ `
      <event-entry
        open=""
        data-title="${escapeHtml(eventData.title)}"
        data-description="${escapeHtml(eventData.description)}"
        data-start-date="${eventData["start-date"]}"
        data-end-date="${eventData["end-date"]}"
        data-locality="${eventData.locality}"
        data-instagram="${eventData.instagram}"
        data-location="${escapeHtml(eventData.location)}"
        data-phone="${eventData.phone}"
        data-image-url="${eventData["image-url"]}"
        data-activity="${eventData.activity}"
        data-spotify="${eventData.spotify}"
        data-youtube="${eventData.youtube}"
        data-slug="${eventData.slug}"
        date="${formatLocalDate(new Date(eventData.startDate))}"
      ></event-entry>
    `;
    html = html.replace(
      /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/is,
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
