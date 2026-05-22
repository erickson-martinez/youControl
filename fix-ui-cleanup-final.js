import fs from 'fs';
const files = [
  './components/BarbeiroAgendaPage.tsx',
  './components/BarbeirosPage.tsx',
  './components/AgendamentoPage.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Clean up duplicate Tailwind classes 
    content = content.replace(/p-4 md:p-6 lg:p-5 md:p-8/g, 'p-6 sm:p-8');
    content = content.replace(/mx-auto mx-auto/g, 'mx-auto');
    content = content.replace(/grid-cols-1 md:grid-cols-1 sm:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');
    content = content.replace(/max-w-6xl mx-auto/g, 'max-w-7xl mx-auto'); // Let it expand more on Desktop
    content = content.replace(/xl:flex-row/g, 'lg:flex-row');
    content = content.replace(/xl:w-\[400px\]/g, 'lg:w-[350px] xl:w-[400px]');
    
    fs.writeFileSync(file, content);
  }
}
console.log('UI cleanup final');
