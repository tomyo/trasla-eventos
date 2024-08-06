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

  // Normal flow when we want to publish an event starting with the received data
  // TODO
  const formBaseUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSdxTx6-LxssWkFlbPqFF6u-QZrNpgC-RJpm9eNweFHXNY8bVA/viewform";
  const queryParams = `usp=pp_url&entry.466826621=${title}&entry.529436666=${text}`;
  // "https://docs.google.com/forms/d/e/1FAIpQLSdxTx6-LxssWkFlbPqFF6u-QZrNpgC-RJpm9eNweFHXNY8bVA/viewform?usp=pp_url&entry.466826621=titu&entry.529436666=des&entry.1874927722=Eventos+/+Fiestas&entry.816687713=Boca+del+Rio&entry.357474557=2024-01-11+11:11&entry.1712632081=5493544123456&entry.1406465718=loc&entry.141426947=inst&entry.312680970=sug"

  return Response.redirect(`${formBaseUrl}?${queryParams}`, 303); // Redirect after handling
}
