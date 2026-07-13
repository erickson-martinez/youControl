const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Remove cdn.tailwindcss.com script
content = content.replace('<script src="https://cdn.tailwindcss.com"></script>', '');

// Remove style tag and its content
const styleStart = content.indexOf('<style>');
const styleEnd = content.indexOf('</style>') + 8;
if (styleStart !== -1 && styleEnd !== -1) {
    content = content.substring(0, styleStart) + content.substring(styleEnd);
}

// Remove tailwind config script
const twConfigStart = content.indexOf('tailwind.config = {');
if (twConfigStart !== -1) {
    const scriptStart = content.lastIndexOf('<script>', twConfigStart);
    const scriptEnd = content.indexOf('</script>', twConfigStart) + 9;
    if (scriptStart !== -1 && scriptEnd !== -1) {
        content = content.substring(0, scriptStart) + content.substring(scriptEnd);
    }
}

fs.writeFileSync('index.html', content);
