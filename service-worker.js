// Firefox doesn't support import as es6 modules yet.
const SHARE_TARGET_ACTION = "/share-target"; // Also used as the cache key for the shared data

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === SHARE_TARGET_ACTION) {
    console.info("Handling share target:", event.request);
    return event.respondWith(handleShareTarget(event.request));
  }
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
 * @param {Request} request - The incoming request containing form data to be processed.
 * @returns {Promise<Response>} - A promise that resolves to a redirect response or an error response if sharing fails.
 */
async function handleShareTarget(request) {
  const formData = await request.formData();
  console.info("[handleShareTarget] received formData: ", [...formData.entries()]);

  const cache = await caches.open(SHARE_TARGET_ACTION);
  let url = "";

  // Clear previous cache entries
  const keys = await cache.keys();
  await Promise.all(keys.map((key) => cache.delete(key)));

  // Cache all formData
  let filesCount = 0; // To make a unique cache key for each file
  for (let [key, value] of formData.entries()) {
    console.log("caching", key, value);
    // Expected keys: title, text, url, files (https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target#params)
    if (value instanceof FileList) {
      key = `/file-${filesCount}`;
      filesCount += 1;
    } else if (key == "text" && URL.canParse(value)) {
      key = "url"; // Fix url arriving in `text` instead of `url`
    }
    if (key == "url") url = value;

    if (!!value) await cache.put(key, new Response(value));
  }

  if (url.toLowerCase().includes("instagram")) {
    return new Response.redirect(`/cargar-evento/instagram.html`, 303);
  }
  // Redirect to publish event page with form data in cache
  return Response.redirect(`/cargar-evento/`, 303);
}

// Push Notification handler
self.addEventListener("push", (event) => {
  const data = event.data.json();
  console.log("Push received", data);

  const options = {
    body: data.body,
    // icon: data.icon,
    // data: data.url,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.sendNotification(data.title ?? "Recordatorio de evento", options));
});

// PWA INSTALL/CACHE handling

self.addEventListener("install", (e) => {
  self.skipWaiting(); // Activate worker immediately after installation
});
