async function run() {
  const email = 'qa.meta.gtm@gmail.com';
  
  const txData = {
    idEmail: email,
    name: "Test Inv",
    amount: 1000,
    date: "2026-06-15",
    type: "investment",
    status: "investimento",
    investment: { percentage: 10, renderDay: 0 }
  };
  
  const r = await fetch(`https://stok-5ytv.onrender.com/transactions/simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(txData)
  });
  const d = await r.json();
  console.log(JSON.stringify(d, null, 2));
}
run();
