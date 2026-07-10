const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';
const email = 'qa.meta.gtm@gmail.com';

async function fetchAll() {
  const res = await fetch(`${API_BASE_URL}/transactions?targetEmail=${email}&sharedEmail=${email}&includeShared=true`);
  const data = await res.json();
  console.log("All transactions count:", data.transactions ? data.transactions.length : 0);
  
  if (data.transactions) {
    let sum = 0;
    data.transactions.forEach(tx => {
      if (tx.status === 'pago') {
         if (tx.type === 'revenue') sum += tx.amount;
         if (tx.type === 'expense') sum -= tx.amount;
      }
    });
    console.log("Calculated Paid Balance:", sum);
  }
}
fetchAll();
