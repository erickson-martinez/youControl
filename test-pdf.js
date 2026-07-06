const { jsPDF } = require('jspdf');
const pdf = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: [297, 600]
});
console.log(pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
