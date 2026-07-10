const API_BASE_URL = 'https://stok-5ytv.onrender.com/api/v1';

async function test() {
  const id = 'MAD9dfISVbNVWsEWJXySOPrtkfm1'; // Let's use the one we tested earlier
  const res6 = await fetch(`${API_BASE_URL}/transactions?idEmail=${id}&month=6&year=2026`);
  const data6 = await res6.json();
  const res7 = await fetch(`${API_BASE_URL}/transactions?idEmail=${id}&month=7&year=2026`);
  const data7 = await res7.json();
  
  console.log("June accumulated:", data6.summary.accumulatedBalance);
  console.log("July accumulated:", data7.summary.accumulatedBalance);
  console.log("July monthly:", data7.summary.monthlyBalance);
  console.log("Diff:", data7.summary.accumulatedBalance - data7.summary.monthlyBalance);
}
test();
