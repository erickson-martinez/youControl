const fs = require('fs');
const glob = require('glob');

// Use native fs.readdirSync to find *Modal.tsx in components
const files = fs.readdirSync('components').filter(f => f.endsWith('Modal.tsx'));

files.forEach(file => {
  const filePath = `components/${file}`;
  let content = fs.readFileSync(filePath, 'utf8');

  // Typically: className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl relative text-white"
  // or similar without max-h-[95vh]
  
  // We can use a regex to match the modal container class
  // It's usually the div right after the one with "fixed inset-0"
  
  // Actually, a simpler way is just to add "max-h-[95vh] overflow-y-auto" to any class that has "bg-gray-800 rounded-lg shadow-xl"
  if (content.includes('bg-gray-800') && content.includes('rounded-lg') && content.includes('shadow-xl') && !content.includes('overflow-y-auto')) {
      content = content.replace(/(bg-gray-800[^"]*rounded-lg[^"]*shadow-xl[^"]*)/, "$1 max-h-[95vh] overflow-y-auto");
      fs.writeFileSync(filePath, content);
      console.log(`Fixed ${file}`);
  }
});
