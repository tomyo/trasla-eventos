import {
  slugify,
  renderEventEntry,
  getEventSortOrder,
  makeCssToHideAbsentLocalitiesInFooter,
  eventsToSchemaOrgItemList,
  localityToSchemaOrgItem,
} from "./shared/lib/utils.js";

const day = 60 * 60 * 24;

export default async function handler(req) {
  const url = new URL(req.url);
  const { origin } = url;
  const localitySlug = url.pathname.replace(/\/lugar\/(.*)\//, "$1");
  const locality = localitySlug
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
  const eventsResponse = await fetch(`${origin}/api/v1/events`);
  const events = await eventsResponse.json();
  const filteredEvents = events
    .filter((event) => slugify(event.locality) === localitySlug)
    .sort((a, b) => getEventSortOrder(a) - getEventSortOrder(b));

  let html = await (await fetch(`${url.origin}/index.html`)).text();

  const contentMeta = /*html*/ `
    <title>Próximos eventos en ${locality} | TRASLA EVENTOS</title>
    <link
      rel="canonical"
      property="og:url"
      href="${url.origin}${url.pathname}"
    />
    <meta property="og:title" content="Próximos eventos en ${locality}" />
    <meta
      name="description"
      property="og:description"
      content="¿Qué hacer en ${locality}? Información actualizada de todos los eventos en ${locality} de hoy y de la semana."
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
    <meta property="og:url" content="${url.origin}${url.pathname}" />

    <meta property="og:site_name" content="TRASLA EVENTOS" />
    <meta property="og:locale" content="es-AR" />

    <script type="application/ld+json">
      ${JSON.stringify(localityToSchemaOrgItem(locality, url.origin))}
    </script>
    ${
      filteredEvents.length
        ? /*html*/ `
          <script type="application/ld+json">
            ${JSON.stringify(eventsToSchemaOrgItemList(filteredEvents, url.origin))}
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

      /* Hide each locality link in footer when locality doesn't have events to show */
      ${makeCssToHideAbsentLocalitiesInFooter(events)}
    </style>
  `;

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

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": `public, max-age=${day / 2}, s-maxage=${day}, stale-while-revalidate=${day}, stale-if-error=${day * 2}`,
    },
  });
}

export const config = {
  runtime: "edge",
};
