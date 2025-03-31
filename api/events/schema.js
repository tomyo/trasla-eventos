import { getGoogleSheetEvents } from "../shared/lib/get-events.js";
import { escapeHtml } from "../shared/lib/utils.js";

export default async function handler(req) {
  const url = new URL(req.url);
  const events = await getGoogleSheetEvents();
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        name: event.title,
        url: `${url.origin}/${event.slug}`,
        startDate: event.startDate,
        endDate: event.endDate,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.locality,
          address: `${event.locality}, Córdoba, Argentina`,
          url: event.location,
        },
        description: escapeHtml(event.description),
        image: event.imageUrl,
      },
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
