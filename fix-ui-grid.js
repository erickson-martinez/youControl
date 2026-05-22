import fs from 'fs';
const files = [
  './components/BarbeiroAgendaPage.tsx',
  './components/BarbeirosPage.tsx',
  './components/AgendamentoPage.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // grid replacements
    content = content.replace(/grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');
    content = content.replace(/grid-cols-1 sm:grid-cols-1 sm:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');
    content = content.replace(/grid-cols-3/g, 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3');
    content = content.replace(/grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-3/g, 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3');
    content = content.replace(/w-full max-w-sm/g, 'w-full max-w-md mx-auto');
    content = content.replace(/w-full max-w-md/g, 'w-full max-w-lg mx-auto');

    // Remove duplicates that might have been caused
    content = content.replace(/grid-cols-1 sm:grid-cols-1 sm:grid-cols-2/g, 'grid-cols-1 sm:grid-cols-2');

    fs.writeFileSync(file, content);
  }
}
console.log('UI grids updated');
