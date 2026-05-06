import { getAllEventsPublicSheetData } from "./shared/lib/get-events.js";
import { generateSitemapXml } from "./shared/lib/sitemap.js";

export default async function handler(req) {
  const url = new URL(req.url);
  const events = await getAllEventsPublicSheetData();
  const xml = generateSitemapXml(events, url.origin);

  const oneMinute = 60;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": `public, s-maxage=${oneMinute}, stale-while-revalidate=${oneMinute}`,
    },
  });
}

export const config = {
  runtime: "edge",
};
