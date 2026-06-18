function calculateInvestmentValue(tx, targetDate = new Date()) {
    if (!tx.investment) return Number(tx.amount || 0);

    const amount = Number(tx.amount || 0);
    const safeDateStr = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
    const startDate = new Date(safeDateStr + "T00:00:00");
    let end = new Date(targetDate);
    
    if (tx.status === 'pago' && tx.updatedAt) {
        const updatedDate = new Date(tx.updatedAt);
        if (updatedDate < end) {
            end = updatedDate;
        }
    }
    
    startDate.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    if (startDate > end) return amount;

    let businessDays = 0;
    let curDate = new Date(startDate);
    curDate.setDate(curDate.getDate() + 1); // skip start date!
    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
        curDate.setDate(curDate.getDate() + 1);
    }

    if (businessDays === 0) return amount;

    let renderDay = tx.investment.renderDay ? Number(tx.investment.renderDay) : 0;
    if (!renderDay || renderDay <= 0) {
        if (tx.investment.percentage) {
            const pct = Number(tx.investment.percentage);
            renderDay = amount * 0.00034 * (pct / 100);
        }
        if (!renderDay || renderDay <= 0) renderDay = 0.01;
    }
    
    const dailyRate = renderDay / amount;
    return amount * Math.pow(1 + dailyRate, businessDays);
}

const tx1 = {
  amount: 9026.25,
  date: "2026-06-17",
  status: "nao_pago",
  investment: {
    percentage: 100, // wait what is the percentage? let's guess 110%
    renderDay: 0
  }
};

const tx2 = {
  amount: 10033.50,
  date: "2026-06-17",
  status: "nao_pago",
  investment: {
    percentage: 100,
    renderDay: 0
  }
};

const target = new Date("2026-06-18T10:00:00.000Z");

console.log("Tx1 (100%):", calculateInvestmentValue({...tx1, investment: {percentage: 100, renderDay:0}}, target));
console.log("Tx1 (110%):", calculateInvestmentValue({...tx1, investment: {percentage: 110, renderDay:0}}, target));
console.log("Tx1 (manual 1 day?):", 9026.25 * Math.pow(1 + 0.00034*1.1, 1));
console.log("Tx1 (manual 2 days?):", 9026.25 * Math.pow(1 + 0.00034*1.1, 2));

console.log("Goal 1:", 9031.52);

