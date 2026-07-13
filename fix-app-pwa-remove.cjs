const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

// remove import
content = content.replace("import InstallPWAButton from './components/InstallPWAButton';\n", "");

// remove component
content = content.replace("      <InstallPWAButton />\n", "");

fs.writeFileSync('App.tsx', content);
console.log("APP MODIFIED");
