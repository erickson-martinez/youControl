const { Jimp } = require('jimp');

async function createImages() {
  const img192 = new Jimp({ width: 192, height: 192, color: '#1f2937' });
  await img192.write('public/pwa-192x192.png');
  
  const img512 = new Jimp({ width: 512, height: 512, color: '#1f2937' });
  await img512.write('public/pwa-512x512.png');
  await img512.write('public/apple-touch-icon.png');
  
  console.log("Images created successfully");
}

createImages().catch(console.error);
