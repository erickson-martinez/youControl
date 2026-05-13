const https = require('https');
https.get('https://flow-gen.vercel.app/api/permissions', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});
