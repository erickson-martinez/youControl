const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';
const email = 'qa.meta.gtm@gmail.com';

async function cleanup() {
  const res = await fetch(`${API_BASE_URL}/transactions?idEmail=${email}&month=7&year=2026`);
  const data = await res.json();
  if (data.transactions) {
    for (const tx of data.transactions) {
      if (tx.name === 'Invest Test' || tx.name === 'Invest Cash Test' || tx.name.includes('Test')) {
        console.log("Deleting:", tx.name, tx._id);
        await fetch(`${API_BASE_URL}/transactions/${tx._id}`, { method: 'DELETE' });
      }
    }
  }
}
cleanup();
