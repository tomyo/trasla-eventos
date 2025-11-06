import { transform, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import fs from "fs/promises";
import { glob } from "glob";
import path from "path";

// Directory where components are stored
const COMPONENTS_DIR = "/components/";
const OMIT_DIRS = ["node_modules", "components", "admin"];

async function getComponentScripts(html) {
  const scriptRegex = /<script\b[^>]*src=["']([^"']*\.js)["'][^>]*>/gi;
  const scripts = [];
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (match[1].includes(COMPONENTS_DIR)) {
      scripts.push(match[1]);
    }
  }
  return scripts;
}

async function getPreloadedModules(html) {
  const linkRegex = /<link\b[^>]*rel=["']modulepreload["'][^>]*href=["']([^"']*\.js)["'][^>]*>/gi;
  const modules = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1].includes(COMPONENTS_DIR)) {
      modules.push(match[1]);
    }
  }
  return modules;
}

async function processHtmlFile(htmlPath) {
  const dirname = path.dirname(htmlPath);
  const html = await fs.readFile(htmlPath, "utf-8");
  let combined = "";
  let imports = "";

  // 1. Extract CSS from <style>…</style> in the HTML
  const matches = html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
  for (const match of matches) {
    combined += match[1] + "\n";
  }

  // 2. Add CSS files from the same directory
  const localCssFiles = glob.sync(path.join(dirname, "*.css"), { ignore: [path.join(dirname, "legacy.css")] });
  for (const cssFile of localCssFiles) {
    console.log(`* Importing css found in same directory: ${cssFile}`);
    combined += (await fs.readFile(cssFile, "utf-8")) + "\n";
  }

  // 3. Add CSS from components that are imported in the HTML file
  const componentScripts = await getComponentScripts(html);
  for (const script of componentScripts) {
    const cssLookupPath = path.join("./", script.replace(".js", ".css"));
    const componentCssFiles = glob.sync(cssLookupPath);

    for (const cssFile of componentCssFiles) {
      console.log(`* Importing component "${script}" css found: ${cssFile}`);
      combined += (await fs.readFile(cssFile, "utf-8")) + "\n";
    }
  }

  // 4. Add css in linked (proloaded) modules as well
  const preloadedModules = await getPreloadedModules(html);
  for (const module of preloadedModules) {
    const cssLookupPath = path.join("./", module.replace(".js", ".css"));
    const moduleCssFiles = glob.sync(cssLookupPath);

    for (const cssFile of moduleCssFiles) {
      console.log(`* Importing preloaded module "${module}" css found: ${cssFile}`);
      combined += (await fs.readFile(cssFile, "utf-8")) + "\n";
    }
  }

  // Return both imports and regular CSS
  return { imports, combined };
}

async function main() {
  const indexFiles = glob.sync("**/index.html", {
    ignore: OMIT_DIRS.map((dir) => `${dir}/**`),
  });
  const targets = browserslistToTargets(browserslist("Safari  >= 14 and not dead"));
  console.log("Browser targets:", targets);

  // 2. Process each index.html file
  for (const indexFile of indexFiles) {
    const dirname = path.dirname(indexFile);
    const outfile = path.join(dirname, "legacy.css");

    console.log(`Processing ${indexFile}...`);
    const { imports, combined } = await processHtmlFile(indexFile);

    // Combine CSS with imports first for this specific HTML file
    const finalCss = imports + combined;

    // Transform with Lightning CSS
    const { code } = transform({
      code: Buffer.from(finalCss),
      minify: false,
      sourceMap: true,
      targets,
    });

    // Write out the legacy stylesheet next to its index.html
    await fs.writeFile(outfile, code);
    console.log(`✅ ./${outfile} [created]`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
