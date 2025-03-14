import Fuse from "./external/fuse.v7.0.0.mjs";
import { unslugify } from "./utils.js";

const defaultOptions = {
  keys: [
    { name: "slug", weight: 8 },
    { name: "title", weight: 3 },
    { name: "locality", weight: 2 },
    { name: "start-date", weight: 2 },
  ],
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.5, // 0 full strict, 1 full relax
  isCaseSensitive: false,
  shouldSort: true,
};

/**
 *
 * @param {[eventData]} events, array of events
 * @param {String} query, search query
 * @param {Object} options, options for Fuse fuzzy search
 * @returns {[Object]} array of events found sorted y score (first is best mathch)
 *          { item: {eventData}, score: {Number} , refIndex: {Number} }
 */
export function fuzzySearch(events, query, options = defaultOptions) {
  const fuse = new Fuse(events, options);
  const searchResults = fuse.search(unslugify(query));
  return searchResults ? searchResults.sort((a, b) => a.score - b.score) : [];
}
