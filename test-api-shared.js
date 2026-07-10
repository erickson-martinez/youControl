const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';

async function test() {
  // Create a transaction with idEmail = 'testA', targetEmail = 'testB'
  const payload = {
    idEmail: 'testA@gmail.com',
    targetEmail: 'testB@gmail.com',
    type: 'revenue',
    name: 'Shared Rev',
    amount: 1000,
    date: '2026-07-01T12:00:00Z',
    status: 'pago'
  };
  
  await fetch(`${API_BASE_URL}/transactions/controlled`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  // Fetch for testB
  const res = await fetch(`${API_BASE_URL}/transactions?idEmail=testB@gmail.com&targetEmail=testB@gmail.com&includeShared=true&month=7&year=2026`);
  const data = await res.json();
  console.log("Summary for B:", data.summary);
  console.log("Transactions for B:", data.transactions.length);
}
test();
