const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';

async function test() {
  const res = await fetch(`${API_BASE_URL}/transactions?idEmail=qa.meta.gtm@gmail.com&includeShared=true`);
  const data = await res.json();
  console.log("Returned data keys:", Object.keys(data));
  console.log("Transactions:", data.transactions ? data.transactions.length : 'none');
}
test();
