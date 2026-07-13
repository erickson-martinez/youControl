const fs = require('fs');

let config = fs.readFileSync('vite.config.ts', 'utf8');

config = config.replace(/src: 'pwa-/g, "src: '/pwa-");
config = config.replace(/includeAssets: \['apple-/g, "includeAssets: ['/apple-");

fs.writeFileSync('vite.config.ts', config);
