import { renderEventEntry } from "../event-entry/render.js";
import { appConfig } from "../../lib/config.js";

export function renderEventEntries(events, origin = appConfig.baseUrl) {
  let shownCount = 0;
  let paginateAt = appConfig.rendering.events.initialVisibleItems;

  // Create a date representing today at 23:59:59 in local time
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return events
    .map((eventData, i) => {
      let isHidden = true;

      if (shownCount < paginateAt) {
        shownCount++;
        isHidden = false;
      } else if (new Date(eventData.startsAt) <= todayEnd) {
        shownCount++;
        paginateAt++;
        isHidden = false;
      }

      const mode = isHidden ? "shell" : "full";
      return renderEventEntry(eventData, { origin, firstImageEager: i === 0, mode });
    })
    .join("");
}
