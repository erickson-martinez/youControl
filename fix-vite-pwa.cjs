const fs = require('fs');

let config = fs.readFileSync('vite.config.ts', 'utf8');

// Replace generateSW configuration with injectManifest
const oldConfigStr = `    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000
      },`;

const newConfigStr = `    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5000000
      },
      includeAssets: ['apple-touch-icon.png'],`;

config = config.replace(oldConfigStr, newConfigStr);

fs.writeFileSync('vite.config.ts', config);
