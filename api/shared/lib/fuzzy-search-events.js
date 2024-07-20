import Fuse from "./external/fuse.v7.0.0.mjs";
import { unslugify } from "./utils.js";

const defaultOptions = {
  keys: [
    // "Descripción",
    // { name: "Comienzo", weight: 3 },
    // { name: "Localidad", weight: 3 },
    "Comienzo",
    "Localidad",
    "Título",
    "Instagram",
  ],
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.7, // 0 full strict, 1 full relax
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
