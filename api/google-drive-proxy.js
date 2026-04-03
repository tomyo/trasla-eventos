// IG modules now requires images url to be a public cacheable direct download,
// so we need to convert google drive image links to a more compatible reponse

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    console.log({ url });

    if (!target) {
      return new Response("Missing url param", { status: 400 });
    }

    if (!target.startsWith("https://")) {
      return new Response("Invalid URL", { status: 400 });
    }

    // 🔒 Restrict allowed hosts (important)
    const allowedHosts = ["lh3.googleusercontent.com", "drive.google.com"];

    const targetUrl = new URL(target);

    if (!allowedHosts.includes(targetUrl.hostname)) {
      return new Response("Forbidden host", { status: 403 });
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);

    // Fetch original image
    const upstream = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: 502,
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    // Only allow image/video
    if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
      return new Response("Unsupported media type", { status: 415 });
    }

    // 🚀 Return normalized response
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,

        // 🔥 critical fix for Instagram
        "Cache-Control": "public, max-age=31536000, immutable",

        // optional
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response("Proxy error", { status: 500 });
  }
}

export const config = {
  runtime: "edge",
};
