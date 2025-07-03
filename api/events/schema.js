import { getGoogleSheetEvents } from "../shared/lib/get-events.js";
import { eventToSchemaEventItem } from "../shared/lib/utils.js";
const OG_IMAGE_WIDTH = 1200;

export default async function handler(req) {
  const url = new URL(req.url);
  const events = await getGoogleSheetEvents();
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: eventToSchemaEventItem(event, url.origin),
    })),
  };

  const html = JSON.stringify(schema);

  return new Response(html, {
    headers: { "Content-Type": "application/ld+json" },
  });
}

export const config = {
  runtime: "edge",
};
