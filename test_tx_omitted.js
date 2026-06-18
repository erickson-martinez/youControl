async function fetchTx() {
  const urlParams = new URLSearchParams({ idEmail: 'qa.meta.gtm@gmail.com' });
  const response = await fetch("https://stok-5ytv.onrender.com/transactions?" + urlParams);
  const data = await response.json();
  console.log("No month/year:", data.transactions?.length);
}
fetchTx();
