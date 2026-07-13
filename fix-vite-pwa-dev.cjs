const fs = require('fs');

let config = fs.readFileSync('vite.config.ts', 'utf8');

if (!config.includes('devOptions')) {
  config = config.replace(
    "includeAssets: ['apple-touch-icon.png'],",
    "includeAssets: ['apple-touch-icon.png'],\n      devOptions: {\n        enabled: true,\n        type: 'module',\n      },"
  );
  fs.writeFileSync('vite.config.ts', config);
}
