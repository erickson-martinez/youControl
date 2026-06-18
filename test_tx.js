import crypto from 'crypto';

async function fetchTx() {
  const url = "https://stok-5ytv.onrender.com/transactions?idEmail=qa.meta.gtm@gmail.com&sharedEmail=qa.meta.gtm@gmail.com&targetEmail=qa.meta.gtm@gmail.com&month=6&year=2026";
  const response = await fetch(url);
  const data = await response.json();
  const tx = data.transactions || [];
  console.log("Total tx month 6:", tx.length);

  const url5 = "https://stok-5ytv.onrender.com/transactions?idEmail=qa.meta.gtm@gmail.com&sharedEmail=qa.meta.gtm@gmail.com&targetEmail=qa.meta.gtm@gmail.com&month=5&year=2026";
  const response5 = await fetch(url5);
  const data5 = await response5.json();
  const tx5 = data5.transactions || [];
  console.log("Total tx month 5:", tx5.length);
  const investments5 = tx5.filter(t => t.type === 'INVESTMENT');
  console.log("Investments 5:");
  investments5.forEach(t => console.log(t.name, t.status, t.date, t.amount, t.id));
}
fetchTx();
