import https from "https";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const folderId = process.env.DRIVE_FOLDER_ID;

  if (!folderId) {
    return res.status(500).json({ error: "DRIVE_FOLDER_ID is not set" });
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const boundary = req.headers["content-type"].split("boundary=")[1];
  const parts = buffer.toString().split(`--${boundary}`);

  let fileContent, fileName;
  parts.forEach((part) => {
    if (part.includes("filename=")) {
      fileName = part.match(/filename="(.+)"/)[1];
      fileContent = part.split("\r\n\r\n")[1].trim();
    }
  });

  if (!fileContent || !fileName) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });

  const options = {
    hostname: "www.googleapis.com",
    path: "/upload/drive/v3/files?uploadType=multipart&fields=id",
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=foo_bar_baz`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https
      .request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const result = JSON.parse(data);
          if (result.id) {
            res.status(200).json({ fileId: result.id });
          } else {
            res.status(500).json({ error: "Failed to get file ID" });
          }
        });
      })
      .on("error", (error) => {
        console.error(error);
        res.status(500).json({ error: "Failed to upload file" });
      });

    req.write(
      "--foo_bar_baz\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
        metadata +
        "\r\n--foo_bar_baz\r\nContent-Type: application/octet-stream\r\n\r\n" +
        fileContent +
        "\r\n--foo_bar_baz--"
    );
    req.end();
  });
}
