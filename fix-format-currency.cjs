const fs = require('fs');

let content = fs.readFileSync('components/ListPurcharsePage.tsx', 'utf8');
content = content.replace(
  "const formatCurrency = (value: number) => {\n    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });\n};",
  "const formatCurrency = (value: number | undefined | null) => {\n    if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';\n    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });\n};"
);

fs.writeFileSync('components/ListPurcharsePage.tsx', content);
console.log("Fixed ListPurcharsePage");
