import "../lib/external/gun/gun.js";
import "../lib/external/gun/sea.js";
import "../lib/external/gun/webrtc.js";
import "../lib/external/gun/unset.js";

const DB_NAME = "trasla";
let db;

const config = {
  peers: [
    "http://localhost:8765/gun",
    "https://gun.trasla.com.ar/gun", // Self hosted peer
    "https://gun-manhattan.herokuapp.com/gun",
  ],
};

/**
 *
 * @returns A configured instance of gun as a singleton, poiting to the DB_NAME
 */
export function useDB() {
  // https://gun.eco/docs/API#options
  if (!db) db = window.GUN(config);
  return db;
}
