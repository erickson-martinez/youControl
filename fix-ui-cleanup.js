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
    content = content.replace(/md:p-5 md:p-8/g, 'md:p-8');
    content = content.replace(/p-4 md:p-4 md:p-6 lg:p-8/g, 'p-4 md:p-6 lg:p-8');
    content = content.replace(/w-full w-full/g, 'w-full');
    content = content.replace(/gap-5 md:gap-4 md:gap-6/g, 'gap-4 md:gap-6');

    // Make modals stretch properly on small screens
    content = content.replace(/w-full max-w-sm/g, 'w-full max-w-md w-[calc(100vw-2rem)]');
    
    // Button width full on mobile
    content = content.replace(/\<button\n(.*?)className\=\"(.*?)\"/g, (match, p1, p2) => {
      // we won't blindly add w-full, but for auth/action buttons we could
      return match;
    });

    fs.writeFileSync(file, content);
  }
}
console.log('UI cleanup updated');
