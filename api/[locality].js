import { getGoogleSheetEvents } from "./shared/lib/get-events.js";
import { escapeHtml, eventsToSchemaOrgItemList, slugify } from "./shared/lib/utils.js";

export default async function handler(req) {
  const url = new URL(req.url);
  const localitySlug = url.pathname.replace(/\/lugar\/(.*)\//, "$1");
  const locality = localitySlug
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
  const events = (await getGoogleSheetEvents()).filter((e) => slugify(e.locality) == localitySlug);

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
        content="¿Qué hacer en ${locality}? Información actualizada de todos los eventos de ${locality} de hoy y de la semana."
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
        ${JSON.stringify(eventsToSchemaOrgItemList(events, url.origin))}
      </script>
    `;

  let eventsHtml = "";
  for (const eventData of events) {
    eventsHtml += /*html*/ `
      <event-entry
        class="card"
        open=""
        data-title="${escapeHtml(eventData.title)}"
        data-description="${escapeHtml(eventData.description)}"
        data-starts-at="${eventData.startsAt}"
        data-ends-at="${eventData.endsAt}"
        data-locality="${eventData.locality}"
        data-instagram="${eventData.instagram}"
        data-location="${escapeHtml(eventData.location)}"
        data-phone="${eventData.phone}"
        data-images="${eventData.images}"
        data-activity="${eventData.activity}"
        data-spotify="${eventData.spotify}"
        data-youtube="${eventData.youtube}"
        data-slug="${eventData.slug}"
        data-tickets="${eventData.tickets}"
        data-form="${eventData.form}"
        data-link="${eventData.link}"
      ></event-entry>
    `;
  }
  if (!events.length) {
    eventsHtml += /*html*/ `
    <event-entry
      class="card"
      data-starts-at="${new Date().toISOString()}"
      data-locality="${locality}"
    >
    <h3>No se encontraron eventos :(</h3>
    </event-entry>
    `;
  }

  const contentMetaRegex = /<!-- START CONTENT_METADATA_BLOCK -->[\s\S]*?<!-- END CONTENT_METADATA_BLOCK -->/;
  html = html.replace(contentMetaRegex, contentMeta);

  html = html.replace(
    /(?<openTag><event-entries[^>]*>).*?(?<closeTag><\/event-entries>)/is,
    "$<openTag>" + eventsHtml + "$<closeTag>"
  );

  html = html.replace(
    /(?<openTag><hero-section>).*?(?<closeTag><\/hero-section>)/is,
    `$<openTag>
      <h1 slot="title">Agenda de eventos de <br><span style="font-size:larger;font-weight:bold">${locality}</span></h1>
    $<closeTag>`
  );

  // Reaplace seo-block with the locality name
  html = html.replace(
    /(?<openTag><seo-block>).*?(?<closeTag><\/seo-block>)/is,
    `$<openTag>
      <h2>¿Qué hacer en ${locality}?</h2>
      <p>Información actualizada de todos los eventos de ${locality} de hoy y de la semana.</p>
    $<closeTag>`
  );

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

export const config = {
  runtime: "edge",
};
