import { transform, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import fs from "fs/promises";
import { glob } from "glob";

// Adjust this if your output directory differs
const OUTFILE = "legacy.css";

async function main() {
  // 1. Find all HTML files
  const files = glob.sync("index.html");

  // 2. Extract CSS from <style>…</style>
  let combined = "";
  for (const file of files) {
    const html = await fs.readFile(file, "utf-8");
    // Match all <style>…</style> blocks
    const parts = html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
    if (!parts) continue;
    for (const part of parts) {
      // Strip the tags to leave only the inner CSS
      const css = part.replace(/<style\b[^>]*>|<\/style>/gi, "");
      combined += css + "\n";
    }
  }

  // 3. Compile with Lightning CSS
  //    `targets: { default: true }` uses Browserslist “defaults” (>= 0.5%, last 2 versions, Firefox ESR, not dead)
  // Call this once per build.
  let targets = browserslistToTargets(browserslist("Safari  >= 14 and not dead"));
  console.log(targets);
  // Call this once per build.

  const { code } = transform({
    // filename: "combined.css",
    code: Buffer.from(combined),
    minify: false,
    sourceMap: true,
    targets,
  });

  // 4. Write out the legacy stylesheet
  await fs.writeFile(OUTFILE, code);
  console.log(`✅ ${OUTFILE} generated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
