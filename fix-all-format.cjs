const fs = require('fs');
const glob = require('glob');

const files = fs.readdirSync('components');
files.forEach(file => {
    if (!file.endsWith('.tsx')) return;
    const path = `components/${file}`;
    let content = fs.readFileSync(path, 'utf8');
    
    // Look for formatCurrency
    if (content.includes("value.toLocaleString('pt-BR'")) {
        content = content.replace(/const formatCurrency = \(value: number\) => {\s*return value\.toLocaleString\('pt-BR', { style: 'currency', currency: 'BRL' }\);\s*};/g, 
        "const formatCurrency = (value: number | undefined | null) => {\n    if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';\n    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });\n};");
        
        fs.writeFileSync(path, content);
    }
});
console.log("Fixed all formatCurrency");
