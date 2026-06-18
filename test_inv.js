async function fetchTx() {
  const urlParams = new URLSearchParams({ idEmail: 'qa.meta.gtm@gmail.com' });
  const response = await fetch("https://stok-5ytv.onrender.com/transactions/investments?" + urlParams);
  console.log(response.status);
  const data = await response.json().catch(()=>null);
  console.log("data:", data);
}
fetchTx();
