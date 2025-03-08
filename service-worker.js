const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_0-QeAq8wbM75_YCwEsKHXAEICKQT3f9gLRo3PmM/dev";


self.addEventListener("fetch", (event) => {
  if (event.request.method === "POST" && event.request.url.includes("/share-target")) {
    return event.respondWith(handleShareTarget(event.request));
  }
  console.info("Skipping unrecognized fetch event", event);
});


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
  console.info(request);
  try {
    const formData = await request.formData();
    const params = new URLSearchParams();
    console.info("Received formData: ", [...formData.entries()]);
    // Standard fields
    ['title', 'text', 'url'].forEach(field => {
      params.append(field, formData.get(field) || '');
    });

    // Send files as base64 encoded strings
    for (const file of formData.getAll('files')) {
      if (file.size === 0) {
        console.warn('Skipping empty file:', file.name);
        continue;
      }
      // Append to params (creates multiple "files" entries)
      params.append('files', await readAsDataURL(file));
    }

    const response = await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: params
    });

    const json = await response.json();
    console.info('Share response:', json);
    if (json.status == 303) return Response.redirect(json.location, 303); 

    
    return Response.redirect(
      `/publicar-evento?fileId=${result?.fileId}&description=${encodeURIComponent(text)}`,
      303
    );
  } catch (error) {
    console.error('Sharing failed:', error);
    return new Response('Share failed', {status: 500});
  }
}

// Notifications
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
