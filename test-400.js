fetch('https://stok-5ytv.onrender.com/api/barbers')
  .then(r => console.log('GET /api/barbers', r.status));

fetch('https://stok-5ytv.onrender.com/api/barbers?linkId=')
  .then(r => console.log('GET /api/barbers?linkId=', r.status));

fetch('https://stok-5ytv.onrender.com/api/barbers/null')
  .then(r => console.log('GET /api/barbers/null', r.status));

fetch('https://stok-5ytv.onrender.com/api/barbers?linkId=123')
  .then(r => console.log('GET /api/barbers?linkId=123', r.status));

fetch('https://stok-5ytv.onrender.com/api/barbers', { method: 'POST', body: '{}' })
  .then(r => console.log('POST /api/barbers', r.status));
