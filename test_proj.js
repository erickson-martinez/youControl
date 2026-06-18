const calculateInvestmentValue = (tx, targetDate = new Date()) => {
    if (!tx.investment) return Number(tx.amount || 0);

    const amount = Number(tx.amount || 0);
    const safeDateStr = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
    const startDate = new Date(safeDateStr + "T00:00:00");
    const end = new Date(targetDate);

    startDate.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    if (startDate > end) {
        console.log("StartDate > EndDate:", startDate, end);
        return amount;
    }

    let businessDays = 0;
    let curDate = new Date(startDate);
    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDays++;
        curDate.setDate(curDate.getDate() + 1);
    }

    if (businessDays === 0) return amount;

    let renderDay = Number(tx.investment.renderDay);
    if (!renderDay || renderDay <= 0) {
        renderDay = 0.01;
    }

    const dailyRate = renderDay / amount;
    return amount * Math.pow(1 + dailyRate, businessDays);
};

const tx = { amount: 9026.25, date: "2026-06-17T03:00:00.000Z", investment: { renderDay: 0.01 } };
console.log("Atual:", calculateInvestmentValue(tx));

const currentDate = new Date("2026-06-17T12:00:00.000Z"); // current date passed state
const currentViewDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

console.log("View:", currentViewDate);
console.log("Fim do", calculateInvestmentValue(tx, currentViewDate));
