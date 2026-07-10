const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';

async function test() {
  const params = new URLSearchParams({ idEmail: 'MAD9dfISVbNVWsEWJXySOPrtkfm1', status: 'pendente', includeShared: 'true' });
  const res = await fetch(`${API_BASE_URL}/transactions/overdue?${params.toString()}`);
  const data = await res.json();
  console.log("Overdue transactions count:", data.transactions ? data.transactions.length : 0);
  console.log(data.transactions);
}
test();
