import fs from 'fs';
fetch('https://stok-5ytv.onrender.com/api/barbers?linkId=null')
  .then(r => r.json().catch(() => r.status))
  .then(console.log)
  .catch(console.error);

fetch('https://stok-5ytv.onrender.com/api/barbers?linkId=undefined')
  .then(r => r.json().catch(() => r.status))
  .then(console.log)
  .catch(console.error);

fetch('https://stok-5ytv.onrender.com/api/appointment-barbers?linkId=9298055')
  .then(r => r.json().catch(() => r.status))
  .then(console.log)
  .catch(console.error);
