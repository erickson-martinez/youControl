fetch('https://stok-5ytv.onrender.com/api/v1/shopping-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        shoppingListId: "6a3ff4d3ae860ddeadfada1c",
        userId: "MAD9dfISVbNVWsEWJXySOPrtkfm1",
        name: "Test",
        value: 10,
        quantity: 1
    })
}).then(r => r.json()).then(console.log).catch(console.error);
