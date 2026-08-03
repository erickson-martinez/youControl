const fs = require('fs');

// 1. Remove from HomePage
let homePage = fs.readFileSync('components/HomePage.tsx', 'utf8');
homePage = homePage.replace("import InstallPWAButton from './InstallPWAButton';\n", "");
homePage = homePage.replace("            <InstallPWAButton />\n", "");
fs.writeFileSync('components/HomePage.tsx', homePage);

// 2. Add to App.tsx
let app = fs.readFileSync('App.tsx', 'utf8');
if (!app.includes("import InstallPWAButton")) {
  app = app.replace(
    "import Sidebar from './components/Sidebar';",
    "import Sidebar from './components/Sidebar';\nimport InstallPWAButton from './components/InstallPWAButton';"
  );
  
  app = app.replace(
    /<div id="top-header-portal" className="flex-1 min-w-0 flex justify-end md:justify-center z-10 w-full overflow-hidden"><\/div>\n\s*<\/header>/,
    `<div id="top-header-portal" className="flex-1 min-w-0 flex justify-end md:justify-center z-10 w-full overflow-hidden"></div>\n            <div className="flex-shrink-0 z-20">\n                <InstallPWAButton />\n            </div>\n        </header>`
  );
  fs.writeFileSync('App.tsx', app);
}

