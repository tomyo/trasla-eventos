import { getSheetData } from "../shared/lib/get-events.js";

const SHEET_ID_PUBLIC = process.env.GOOGLE_SHEET_ID_PUBLIC || "18lo82wtHkR4qUEvEl5XeWIKbCSNxN_bgJwmDHRUXSog";
const SHEET_GID_ALL_EVENTS_PUBLIC = process.env.GOOGLE_SHEET_GID_ALL_EVENTS_PUBLIC || "1783307311";
const SHEET_GID_UPCOMING_EVENTS_PUBLIC = process.env.GOOGLE_SHEET_GID_UPCOMING_EVENTS_PUBLIC || "1297613367";

const MINUTE = 60;

export default async function handler(req) {
  const url = new URL(req.url);
  const forceFresh = url.searchParams.has("forceFresh");
  const includePast = url.searchParams.has("includePast");

  try {
    const events = await getSheetData(
      SHEET_ID_PUBLIC,
      includePast ? SHEET_GID_ALL_EVENTS_PUBLIC : SHEET_GID_UPCOMING_EVENTS_PUBLIC,
    );

    return new Response(JSON.stringify(events), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": forceFresh ? "no-store" : `public, s-maxage=${10 * MINUTE}, stale-while-revalidate=${45 * MINUTE}`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = { runtime: "edge" };
