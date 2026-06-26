export const OG_IMAGE_WIDTH = 1200;
export const BASE_URL = "https://eventos.trasla.com.ar";

export const appConfig = {
  ogImageWidth: OG_IMAGE_WIDTH, // px
  baseUrl: BASE_URL,
  rendering: {
    events: {
      initialVisibleItems: 10,
    },
  },
};

// APP RUNTIME CONFIG
const RUNTIME_APP_CONFIG_ID = "app-config";

export function exportAppRuntimeConfig({ keys = ["rendering"] }) {
  return /*html*/ `
  <!--${RUNTIME_APP_CONFIG_ID}:start-->
  <script id="${RUNTIME_APP_CONFIG_ID}" type="application/json">
    ${JSON.stringify(Object.fromEntries(Object.entries(appConfig).filter(([k, _]) => keys.includes(k))))}
  </script>
  <!--${RUNTIME_APP_CONFIG_ID}:end-->
  `;
}

export function extractAppRuntimeConfig(html) {
  if (html) {
    const regExp = new RegExp(`<script\\b[^>]*\\bid=["']${RUNTIME_APP_CONFIG_ID}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i");
    const match = html.match(regExp);
    if (!match) {
      throw new Error("App config not found in html");
    }

    return JSON.parse(match[1]);
  }

  if (typeof document !== "undefined") {
    const el = document.getElementById(RUNTIME_APP_CONFIG_ID);
    if (!el) {
      throw new Error("App config element not found in document");
    }

    return JSON.parse(el.textContent);
  }

  return null;
}
