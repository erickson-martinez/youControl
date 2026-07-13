const fs = require('fs');

let content = fs.readFileSync('components/Dashboard.tsx', 'utf8');

// remove import
content = content.replace("import { usePWAInstall } from '../hooks/usePWAInstall';\n", "");

// remove hook
content = content.replace("  const { isInstallable, installPWA } = usePWAInstall();\n", "");

// remove button
const buttonStart = content.indexOf('{isInstallable && (');
if (buttonStart !== -1) {
    const buttonEnd = content.indexOf(')}', buttonStart) + 2;
    content = content.substring(0, buttonStart) + content.substring(buttonEnd);
}

fs.writeFileSync('components/Dashboard.tsx', content);
console.log("DASHBOARD MODIFIED");
