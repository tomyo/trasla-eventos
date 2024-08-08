export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const folderId = process.env.DRIVE_FOLDER_ID;
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!folderId) {
    return res.status(500).json({ error: "DRIVE_FOLDER_ID is not set" });
  }
  if (!apiKey) {
    return res.status(500).json({ error: "GOOGLE_API_KEY is not set" });
  }

  try {
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

    console.info("Received formData: ", [...formData.entries()], folderId);

    // Process the file or save it to storage here
    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: [folderId],
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      }
    );
    const result = await response.json();
    console.log(result);

    return new Response(
      JSON.stringify({
        message: "File uploaded successfully",
        result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response("Error uploading file", { status: 500 });
  }
}
