import { getGoogleSheetEvents } from "../shared/lib/get-events.js";
import { escapeHtml, getGoogleDriveImagesPreview } from "../shared/lib/utils.js";
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
      item: {
        "@type": "Event",
        name: event.title,
        url: `${url.origin}/${event.slug}`,
        startDate: event.startsAt,
        endDate: event.endsAt,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.place || "",
          address: `${event.locality}, Córdoba, Argentina`,
          url: event.location,
        },
        description: escapeHtml(event.description),
        image: getGoogleDriveImagesPreview(event.images, OG_IMAGE_WIDTH),
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
