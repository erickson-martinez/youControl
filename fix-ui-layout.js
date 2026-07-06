const fs = require('fs');
let content = fs.readFileSync('components/SimuladorSolarPage.tsx', 'utf8');

// replace bg-gray-900 with bg-gray-800 for the cards for better contrast against bg-gray-800 parent
content = content.replace(/className="bg-gray-900 p-4 rounded-lg border border-gray-700"/g, 'className="bg-gray-700 p-4 rounded-lg border border-gray-600"');

fs.writeFileSync('components/SimuladorSolarPage.tsx', content);
