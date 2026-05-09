import fs from "node:fs";
import { spawn } from "node:child_process";

const DIRS_TO_OMIT = ["node_modules", ".git", "dist", ".vscode"];
let timeout;

function runCommand(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: "inherit" });
    proc.on("close", resolve);
  });
}

async function triggerBuild() {
  clearTimeout(timeout);
  timeout = setTimeout(async () => {
    console.log("\n🔄 Changes detected, rebuilding...");
    await runCommand("node", ["scripts/build-static.js", "--fast"]);
    await runCommand("node", ["scripts/build-legacy-css.js"]);
    console.log("👀 Watching for changes...");
  }, 200); // debounce
}

fs.watch(".", { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Ignore changes in specific directories or temporary files
  if (DIRS_TO_OMIT.some(dir => filename.startsWith(dir) || filename.includes(`/${dir}/`))) return;
  if (filename.startsWith(".") && !filename.startsWith(".env")) return;
  if (filename.endsWith("legacy.css")) return;
  if (filename.endsWith(".json") && filename.startsWith("data/")) return;

  triggerBuild();
});

console.log("👀 Watching for changes...");
triggerBuild(); // Initial build
