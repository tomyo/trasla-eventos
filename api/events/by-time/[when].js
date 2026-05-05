import { getUpcomingEventsPublicSheetData } from "../../shared/lib/get-events.js";
import { renderTimePage } from "../../shared/lib/render.js";

const day = 60 * 60 * 24;

export default async function handler(req) {
  const url = new URL(req.url);
  const { origin } = url;
  const when = url.searchParams.get("when");
  const events = await getUpcomingEventsPublicSheetData();
  
  let sMaxage;
  if (when === "hoy") {
    sMaxage = day / 4;
  } else if (when === "esta-semana") {
    sMaxage = day;
  } else if (when === "este-mes") {
    sMaxage = day * 2;
  } else {
    throw new Error("Invalid when parameter: " + when);
  }

  let html = await (await fetch(`${url.origin}/index.html`)).text();

  html = renderTimePage(when, events, html, origin);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": `public, max-age=${sMaxage}, s-maxage=${sMaxage}, stale-while-revalidate=${sMaxage * 2}, stale-if-error=${sMaxage * 4}`,
    },
  });
}

export const config = {
  runtime: "edge",
};
