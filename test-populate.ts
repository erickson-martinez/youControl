fetch('https://stok-5ytv.onrender.com/api/v1/shopping-lists?userId=MAD9dfISVbNVWsEWJXySOPrtkfm1&populate=items')
  .then(r => r.json())
  .then(data => {
    console.log("First list details:", JSON.stringify(data[0], null, 2));
  });
