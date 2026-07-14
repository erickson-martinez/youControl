const sharp = require('sharp');

async function run() {
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 31, g: 41, b: 55, alpha: 1 }
    }
  }).png().toFile('public/pwa-192x192.png');
  
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 31, g: 41, b: 55, alpha: 1 }
    }
  }).png().toFile('public/pwa-512x512.png');

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 31, g: 41, b: 55, alpha: 1 }
    }
  }).png().toFile('public/apple-touch-icon.png');

  console.log("Generated 192 and 512 pngs");
}
run();
