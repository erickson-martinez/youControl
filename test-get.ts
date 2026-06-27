fetch('https://stok-5ytv.onrender.com/api/v1/shopping-items')
.then(r => r.json()).then(console.log).catch(console.error);
