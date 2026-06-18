async function run() {
  const email = 'qa.meta.gtm@gmail.com';
  const m6Params = new URLSearchParams({ idEmail: email, month: '6', year: '2026' });
  const r6 = await fetch(`https://stok-5ytv.onrender.com/transactions?${m6Params.toString()}`);
  const d6 = await r6.json();
  const inv = (d6.transactions||[]).filter(t => t.type === 'investimento' || t.type === 'investment' || t.type === 'INVESTMENT');
  console.log("Found:", inv.map(i => ({ id: i._id, status: i.status })));
}
run();
