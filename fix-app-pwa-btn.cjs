const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

// add import if not exists
if (!content.includes('InstallPWAButton')) {
  content = content.replace("import SimuladorSolarPage from './components/SimuladorSolarPage';", "import SimuladorSolarPage from './components/SimuladorSolarPage';\nimport InstallPWAButton from './components/InstallPWAButton';");
  
  // place it at the end of the root container
  const target = `      <Sidebar user={user} onLogout={handleLogout}`;
  const injection = `      <InstallPWAButton />\n      <Sidebar user={user} onLogout={handleLogout}`;
  content = content.replace(target, injection);

  fs.writeFileSync('App.tsx', content);
  console.log("APP MODIFIED");
} else {
  console.log("ALREADY MODIFIED");
}
