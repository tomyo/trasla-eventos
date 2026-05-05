import { getUpcomingEventsPublicSheetData } from "./shared/lib/get-events.js";
import { renderLocalityPage } from "./shared/lib/render.js";

const day = 60 * 60 * 24;

export default async function handler(req) {
  const url = new URL(req.url);
  const { origin } = url;
  const localitySlug = url.pathname.replace(/\/lugar\/(.*)\//, "$1");
  const locality = localitySlug
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
  
  const events = await getUpcomingEventsPublicSheetData();

  let html = await (await fetch(`${url.origin}/index.html`)).text();

  html = renderLocalityPage(locality, events, html, origin);

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
