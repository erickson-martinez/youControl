const fs = require('fs');
let content = fs.readFileSync('components/ProductModal.tsx', 'utf8');

content = content.replace(
  'className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl relative text-white"',
  'className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl relative text-white max-h-[95vh] overflow-y-auto"'
);

fs.writeFileSync('components/ProductModal.tsx', content);
console.log("ProductModal scroll fixed");
