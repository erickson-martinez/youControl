const endpoints = ['/api/barber-registers', '/api/registers', '/api/barber/registros', '/api/barber-sales', '/api/barber-transactions'];
Promise.all(endpoints.map(e => fetch('https://stok-5ytv.onrender.com' + e).then(res => res.status).then(status => console.log(e, status))));
