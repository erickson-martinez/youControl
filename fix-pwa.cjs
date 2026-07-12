const fs = require('fs');

// Add start_url to manifest
let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
if (!viteConfig.includes("start_url")) {
  viteConfig = viteConfig.replace("display: 'standalone',", "display: 'standalone',\n        start_url: '/',");
  fs.writeFileSync('vite.config.ts', viteConfig);
}

// Add registerSW to index.tsx
let indexFile = fs.readFileSync('index.tsx', 'utf8');
if (!indexFile.includes("virtual:pwa-register")) {
  indexFile = `import { registerSW } from 'virtual:pwa-register';\n\nregisterSW({ immediate: true });\n\n` + indexFile;
  fs.writeFileSync('index.tsx', indexFile);
}
