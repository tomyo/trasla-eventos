import { renderEventEntry } from "../event-entry/render.js";
import { BASE_URL } from "../../lib/utils.js";

export function renderEventEntries(events, origin = BASE_URL) {
  return events.map((eventData, i) => renderEventEntry(eventData, origin, i === 0)).join("");
}
