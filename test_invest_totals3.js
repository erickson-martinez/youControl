async function run() {
  const email = 'qa.meta.gtm@gmail.com';
  
  const m6Params = new URLSearchParams({ idEmail: email, month: '6', year: '2026' });
  const r6 = await fetch(`https://stok-5ytv.onrender.com/transactions?${m6Params.toString()}`);
  const d6 = await r6.json();
  console.log("M6 Acc Bal:", d6.summary?.accumulatedBalance);
  
  const m7Params = new URLSearchParams({ idEmail: email, month: '7', year: '2026' });
  const r7 = await fetch(`https://stok-5ytv.onrender.com/transactions?${m7Params.toString()}`);
  const d7 = await r7.json();
  console.log("M7 Acc Bal:", d7.summary?.accumulatedBalance);
}
run();
