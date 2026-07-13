const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');
if(content.includes('beforeinstallprompt') && content.includes('appinstalled')) {
    console.log("LOGS ADICIONADOS COM SUCESSO");
}
