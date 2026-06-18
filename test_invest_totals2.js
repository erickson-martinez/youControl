async function run() {
  const email = 'qa.meta.gtm@gmail.com';
  
  const m6Params = new URLSearchParams({ idEmail: email, month: '6', year: '2026' });
  const r6 = await fetch(`https://stok-5ytv.onrender.com/transactions?${m6Params.toString()}`);
  const d6 = await r6.json();
  console.log(JSON.stringify(d6, null, 2));
}
run();
