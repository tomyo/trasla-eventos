const DEBUG = false;
const log = (...args) => DEBUG && console.log(...args);

const CONFIG = {
  VERSION: "2024-10-08",
  SHARE_TARGET: "/share-target",

  CACHE: {
    APP: "static-2024-10-08",
    RUNTIME: "runtime-2024-10-08",
    SHEETS: "sheets-2024-10-08",
    DRIVE: "drive-images-2024-10-08",
    SHARE_TARGET: "/share-target",
  },

  HOSTS: {
    SHEETS: new Set(["docs.google.com", "docs.googleusercontent.com"]),
    DRIVE: new Set(["drive.google.com", "lh3.googleusercontent.com"]),
  },
};

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/base.css",
  "/legacy.css",
  "/favicon.ico",
  "/assets/icons/apple-touch-icon.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
  "/components/event-entry.js",
  "/components/event-entry.css",
  "/components/events-filter.js",
  "/components/site-header.js",
  "/components/site-footer.js",
  "/components/install-button/install-button.js",
  "/components/horizontal-carousel/horizontal-carousel.js",
  "/components/share-url/share-url.js",
  "/components/today-date-picker.js",
  "/lib/get-events.js",
  "/lib/utils.js",
  "/lib/fuzzy-search-events.js",
];

const ALLOWED_CACHES = new Set(Object.values(CONFIG.CACHE));

self.addEventListener("install", (event) => {
  log("Service Worker installing...");
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CONFIG.CACHE.APP);
        await cache.addAll(CORE_ASSETS);
      } catch (error) {
        console.warn("Failed to precache app shell", error);
      }
    })(),
  );
  self.skipWaiting(); // Force activation
});

self.addEventListener("activate", (event) => {
  log("Service Worker activated");
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter((cacheName) => !ALLOWED_CACHES.has(cacheName));
      await Promise.all(cachesToDelete.map((cacheName) => caches.delete(cacheName)));
      await clients.claim(); // Take control immediately
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

  const url = new URL(request.url);

  // SHARE TARGET
  // Handle both with and without trailing slash, just in case.
  const isShareTarget =
    request.method === "POST" &&
    (url.pathname === CONFIG.SHARE_TARGET || url.pathname === CONFIG.SHARE_TARGET + "/") &&
    url.origin === self.location.origin;

  if (isShareTarget) {
    log("Handling share target:", request);
    event.respondWith(handleShareTarget(request));
    return;
  }

  if (request.method !== "GET") return;

  // Navigation -> network-first
  if (request.mode === "navigate") {
    return event.respondWith(handleRequest(request, "network-first", CONFIG.CACHE.RUNTIME));
  }

  //  External Sheets (data) -> network-first
  if (CONFIG.HOSTS.SHEETS.has(url.hostname)) {
    return event.respondWith(handleRequest(request, "network-first", CONFIG.CACHE.SHEETS));
  }

  // External Drive (images) -> cache-first
  if (CONFIG.HOSTS.DRIVE.has(url.hostname)) {
    return event.respondWith(handleRequest(request, "cache-first", CONFIG.CACHE.DRIVE));
  }

  // Same-origin assets (JS, CSS, etc.) -> stale-while-revalidate
  if (url.origin === self.location.origin) {
    return event.respondWith(handleRequest(request, "stale-while-revalidate", CONFIG.CACHE.RUNTIME));
  }
});

/**
 * @param {Request} request - The incoming request containing form data to be processed.
 * @returns {Promise<Response>} - A promise that resolves to a redirect response or an error response if sharing fails.
 */
async function handleShareTarget(request) {
  const formData = await request.formData();
  log("[handleShareTarget] received formData: ", [...formData.entries()]);

  let url = "";
  const normalizedEntries = [];

  // Normalize entries and extract URL first (no side effects yet)
  for (let [key, value] of formData.entries()) {
    // Expected keys: title, description, url, files (see manifest.json share_target.params)
    if ((key === "description" || key === "text") && typeof value === "string" && URL.canParse(value)) {
      key = "url"; // Fix url arriving in `description` instead of `url`.
    }

    if (key === "url" && value) {
      url = value;
    }

    normalizedEntries.push([key, value]);
  }

  // If shared URL belongs to this site → bypass share handler and redirect to it.
  if (url) {
    try {
      const parsed = new URL(url, self.location.origin);

      if (parsed.origin === self.location.origin) {
        return Response.redirect(parsed.href, 303);
      }
    } catch {
      // Ignore invalid URL
    }
  }

  const cache = await caches.open(CONFIG.CACHE.SHARE_TARGET);

  // Clear previous cache entries
  const keys = await cache.keys();
  await Promise.all(keys.map((key) => cache.delete(key)));

  // Cache all formData
  let filesCount = 0; // To make a unique cache key for each file
  const filesList = []; // To store file IDs for later use

  for (let [key, value] of normalizedEntries) {
    if (!value) continue;

    if (value instanceof FileList || value instanceof File) {
      key = `file-${filesCount}`;
      filesList.push(key); // Store the file ID for later use
      filesCount += 1;
    }

    await cache.put(new Request(`/${key}`), new Response(value instanceof File ? value : String(value)));

    log("caching", key);
  }

  // Store files order once
  await cache.put(
    new Request(`/files-list`),
    new Response(JSON.stringify(filesList), {
      headers: { "Content-Type": "application/json" },
    }),
  );

  // Routing logic after processing
  if (url && url.toLowerCase().includes("instagram")) {
    return Response.redirect(`/publicar-evento/instagram.html`, 303);
  }

  // Redirect to publish event page with form data in cache
  return Response.redirect(`/publicar-evento/`, 303);
}

// MESSAGE HANDLER FOR EVENT POSTING
self.addEventListener("message", (event) => {
  if (event.data.type !== "POST_EVENT") {
    console.warn("Unknown message type:", event.data?.type);
    log("Full event data:", event.data);
    return;
  }

  log("Handling event posting request from client", event.data);
  event.waitUntil(
    handlePostEvent(event).catch((error) => {
      console.error("Critical error in handlePostEvent:", error);
      // Ensure client gets a response even if something goes wrong
      if (event.ports?.[0]) {
        event.ports[0].postMessage({
          success: false,
          error: `Service worker error: ${error.message}`,
        });
      }
      return notify(`Error crítico en SW: ${error.message}`, { type: "sw-error" }, "error");
    }),
  );
});

/**
 * Handles event posting delegated from the client
 * @param {MessageEvent} messageEvent - The message event from the client
 */
async function handlePostEvent(messageEvent) {
  const responsePort = messageEvent.ports?.[0];

  try {
    if (!messageEvent.data?.payload) throw new Error("No payload found in message event");
    if (!responsePort) throw new Error("No response port found in message event");

    log("Extracting payload from messageEvent.data.payload", messageEvent.data.payload);
    const { api, query, description, files } = messageEvent.data.payload;
    const action = `${api}${query}`;

    const isTestEnvironment = self.location.hostname === "localhost" && description?.includes("test");

    let response;
    if (isTestEnvironment) {
      log("Test environment detected, returning mocked response");
      response = new Response(
        JSON.stringify({
          success: true,
          data: { slug: "test-event-slug-123", id: "event-123", title: "Test Event" },
        }),
        { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } },
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      response = await fetch(action, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ description, files, fast: true }),
      });
    }

    const eventData = await parseJSONResponse(response);

    try {
      responsePort.postMessage({ success: true, data: eventData });
      log("Success response sent to client");
    } catch (portError) {
      console.error("Failed to send success message through port:", portError);
    }

    if (!eventData.slug) return;

    return notify(
      "¡Éxito! 🎉",
      {
        body: "Tu evento ha sido cargado, está listo para ver!.",
        data: {
          type: "event-posted",
          clientId: messageEvent.source?.id,
          url: `${self.location.origin}/${eventData.slug}`,
        },
      },
      "success",
    );
  } catch (error) {
    console.error("Error posting event in service worker:", error);

    if (responsePort) {
      try {
        responsePort.postMessage({ success: false, error: error.message });
      } catch (portError) {
        console.error("Failed to send error message through port:", portError);
      }
    }

    return notify(
      "Error",
      {
        body: `Hubo un problema: ${error.message}`,
        data: { type: "event-error" },
      },
      "error",
    );
  }
}

// Push Notification handler
self.addEventListener("push", (event) => {
  const data = event.data.json();
  log("Push received", data);
  event.waitUntil(notify(data.title, { body: data.body }));
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  notification.close();

  // Navigate to the event page when success notification is clicked
  event.waitUntil(
    (async () => {
      // Check if a client with the given id exists, this was the client that initiated the comunication
      let client = await clients.get(notification.data?.clientId);
      if (!client) {
        const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
        if (clientList.length > 0) {
          client = clientList.find((client) => client.url.includes(notification.data?.url));
          if (!client) client = clientList.find((client) => client.url.includes("/publicar-evento"));
          if (!client) client = clientList[0];
        }
      }
      if (client) {
        await client.focus();
        if (notification.data?.url && !client.url.includes(notification.data.url)) {
          return client.navigate(notification.data.url);
        } else {
          return;
        }
      }
      if (notification.data?.url) {
        return clients.openWindow(notification.data.url);
      }
    })(),
  );
});

// UTILS

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
/**
 * Show a notification with consistent styling
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @returns {Promise<void>}
 */
function notify(title, options = {}, type = "default") {
  const base = {
    icon: "/assets/icons/icon-192x192.png",
    vibrate: [200, 100, 200],
  };

  const presets = {
    success: { tag: "trasla-success", requireInteraction: true },
    error: { tag: "trasla-error", vibrate: [200, 100, 200, 100, 200] },
  };

  return self.registration.showNotification(title, { ...base, ...(presets[type] || {}), ...options });
}

async function parseJSONResponse(response) {
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  log("Parsed JSON response:", json);

  if (!json.success) {
    throw new Error(`${json.message}\n${JSON.stringify(json.metadata)}`);
  }

  return json.data;
}

function isCacheableResponse(response, request) {
  if (!response) return false;
  if (response.type === "opaqueredirect") return false;
  if (response.type === "opaque") {
    try {
      const url = new URL(request.url);
      return CONFIG.HOSTS.DRIVE.has(url.hostname);
    } catch {
      return false;
    }
  }
  return response.ok;
}

async function handleRequest(request, strategy, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  try {
    if (strategy === "cache-first" && cached) return cached;

    const network = await fetch(request);

    if (isCacheableResponse(network, request)) {
      cache.put(request, network.clone());
    }

    if (strategy === "network-first") return network;

    if (strategy === "stale-while-revalidate") {
      if (cached) return cached;
      return network;
    }

    return network;
  } catch (err) {
    if (cached) return cached;

    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }

    throw err;
  }
}
