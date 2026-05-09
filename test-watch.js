import fs from 'node:fs';
console.log('Testing watch...');
const watcher = fs.watch('.', { recursive: true }, (event, filename) => {
  console.log(event, filename);
});
setTimeout(() => watcher.close(), 1000);
