const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';

async function test() {
  const res = await fetch(`${API_BASE_URL}/transactions?idEmail=MAD9dfISVbNVWsEWJXySOPrtkfm1&includeShared=true`);
  const data = await res.json();
  console.log("Returned transactions count without month/year:", data.transactions ? data.transactions.length : 0);
}
test();
