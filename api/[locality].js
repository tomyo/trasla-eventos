export default async function handler(req) {
  const url = new URL(req.url);
  const localitySlug = url.pathname.replace(/\/lugar\/(.*)\//, "$1");
  const locality = localitySlug
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");

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
      <style>
        /* hide locality selector */
        events-filter form select-locality {
            display: none;
          }

        events-filter form span:has(~ select-locality) {
          display: none;
        }
      </style>
    `;

  const contentMetaRegex = /<!-- START CONTENT_METADATA_BLOCK -->[\s\S]*?<!-- END CONTENT_METADATA_BLOCK -->/;
  html = html.replace(contentMetaRegex, contentMeta);

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
    headers: { "Content-Type": "text/html", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=30" },
  });
}

export const config = {
  runtime: "edge",
};
