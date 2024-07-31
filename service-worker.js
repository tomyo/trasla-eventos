self.addEventListener("fetch", (event) => {
  if (
    event.request.method === "POST" &&
    event.request.url.endsWith("/share-target")
  ) {
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
    console.log("File name:", file.name);
    console.log("File type:", file.type);
    console.log("File size:", file.size, "bytes");
  }

  const file = files ? files[0] : null;

  // Handle the shared content as needed
  // You can upload it to your server or process it as required

  console.log({ title, text, url, file }, [...formData.entries()]);

  const searchParams = new URLSearchParams({
    title,
    text,
    url,
    file_name: file?.name,
    file_type: file?.type,
    file_size: file?.size,
  });

  // Get the query string
  const queryString = searchParams.toString();

  return Response.redirect(`/share-target?${queryString}`, 303); // Redirect after handling
}
