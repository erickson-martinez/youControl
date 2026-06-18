const tx = { amount: 9026.25, date: "17/06/2026" };
const safeDateStr = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
const startDate = new Date(safeDateStr + "T00:00:00");
const end = new Date();
end.setHours(23,59,59,999);
startDate.setHours(0,0,0,0);
console.log("Start Date:", startDate);
console.log("Start > End:", startDate > end);
let businessDays = 0;
let curDate = new Date(startDate);
console.log("curDate <= end:", curDate <= end);
while(curDate <= end) {
    businessDays++;
    curDate.setDate(curDate.getDate() + 1);
}
console.log("Business Days:", businessDays);
