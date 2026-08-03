const fs = require('fs');
let content = fs.readFileSync('components/InstallPWAButton.tsx', 'utf8');

// replace the return statement with a simpler button without fixed positioning
content = content.replace(
  /<div className="fixed bottom-4 left-1\/2 transform -translate-x-1\/2 z-\[9999\] w-11\/12 max-w-md">([\s\S]*?)<\/div>/,
  `$1` // just extract the button
);
content = content.replace(
  /w-full py-3 px-4 \${deferredPrompt \? 'bg-blue-accent hover:bg-blue-600 animate-bounce shadow-blue-500\/50' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 shadow-gray-900\/50'} text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300/,
  `py-2 px-4 text-sm \${deferredPrompt ? 'bg-blue-accent hover:bg-blue-600 animate-bounce shadow-blue-500/50' : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'} text-white font-bold rounded-lg shadow flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap`
);

content = content.replace(
  /{deferredPrompt \? 'Instalar App \(Acesso Rápido\)' : isIOS \? 'Como Instalar no iOS' : 'Instalar App \(Manual\)'}/,
  `{deferredPrompt ? 'Instalar App' : isIOS ? 'Instalar iOS' : 'Instalar App'}`
);


fs.writeFileSync('components/InstallPWAButton.tsx', content);
