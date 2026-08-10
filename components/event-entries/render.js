import { renderEventEntry } from "../event-entry/render.js";
import { appConfig } from "../../lib/config.js";
import { formatLocalDate } from "../../lib/utils.js";

export function renderEventEntries(events, origin = appConfig.baseUrl) {
  let shownCount = 0;
  let paginateAt = appConfig.rendering.events.initialVisibleItems;

  const today = formatLocalDate(new Date());

  return events
    .map((eventData, i) => {
      let isHidden = true;

      if (shownCount < paginateAt) {
        shownCount++;
        isHidden = false;
      } else if (formatLocalDate(new Date(eventData.startsAt)) <= today) {
        shownCount++;
        paginateAt++;
        isHidden = false;
      }

      const mode = isHidden ? "shell" : "full";
      return renderEventEntry(eventData, { origin, firstImageEager: i === 0, mode });
    })
    .join("");
}
