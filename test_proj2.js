const safeDateStr = "2026-06-17";
const startDate = new Date(safeDateStr + "T00:00:00");
const currentDate = new Date("2026-06-17T18:50:26-07:00");
const currentViewDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

console.log("Local start date:", startDate.toString());
console.log("End date (View):", currentViewDate.toString());

startDate.setHours(0,0,0,0);
currentViewDate.setHours(23,59,59,999);

console.log("Start > End (View)?", startDate > currentViewDate);
