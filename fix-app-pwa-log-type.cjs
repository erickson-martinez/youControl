const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(/handleBeforeInstallPrompt = \(e\) =>/g, "handleBeforeInstallPrompt = (e: any) =>");
content = content.replace(/handleAppInstalled = \(e\) =>/g, "handleAppInstalled = (e: any) =>");

fs.writeFileSync('App.tsx', content);
