import crypto from 'crypto';

async function fetchTx() {
  const url = "https://stok-5ytv.onrender.com/transactions?idEmail=qa.meta.gtm@gmail.com";
  const response = await fetch(url);
  const data = await response.json();
  const tx = data.transactions || [];
  console.log("Total tx without month:", tx.length);
  const investments = tx.filter(t => t.type === 'INVESTMENT');
  console.log("Investments length:", investments.length);
}
fetchTx();
