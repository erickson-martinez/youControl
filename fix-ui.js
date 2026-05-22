import fs from 'fs';
const files = [
  './components/BarbeiroAgendaPage.tsx',
  './components/BarbeirosPage.tsx',
  './components/AgendamentoPage.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // padding replacements
    content = content.replace(/p-6 md:p-8/g, 'p-4 md:p-6 lg:p-8');
    content = content.replace(/p-8/g, 'p-5 md:p-8');
    content = content.replace(/gap-8/g, 'gap-5 md:gap-8');
    content = content.replace(/gap-6/g, 'gap-4 md:gap-6');
    content = content.replace(/h-16/g, 'h-12 md:h-16');
    content = content.replace(/w-16/g, 'w-12 md:w-16');
    content = content.replace(/text-3xl/g, 'text-2xl md:text-3xl');
    
    fs.writeFileSync(file, content);
  }
}
console.log('UI updated');
