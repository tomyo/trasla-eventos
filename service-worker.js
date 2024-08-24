self.addEventListener("fetch", (event) => {
  if (event.request.method === "POST" && event.request.url.endsWith("/share-target")) {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  console.info(request);
  const formData = await request.formData();
  const title = formData.get("title");
  const text = formData.get("text");
  const url = formData.get("url");
  const files = formData.getAll("files");

  for (const file of files) {
    console.info("File name:", file.name);
    console.info("File type:", file.type);
    console.info("File size:", file.size, "bytes");
  }

  const file = files ? files[0] : null;

  console.info("Received formData: ", [...formData.entries()]);

  if (!url && !file) {
    const urlInText = URL.parse(text);
    if (urlInText.hostname === "eventos.trasla.com.ar") {
      // We are receiving an event URL, let's open it
      return Response.redirect(urlInText, 303); // Redirect after handling
    }
  }

  const response = await fetch("/api/upload-file-to-drive", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const result = await response.json();
  if (result.fileId) {
    console.log("Uploaded file ID:", result.fileId);
  } else {
    console.error("Error:", result.error);
  }

  return Response.redirect(
    `/publicar-evento?fileId=${result?.fileId}&description=${encodeURIComponent(text)}`,
    303
  );
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
