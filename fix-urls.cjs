const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(regex, replacement);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath, /\$\{API_BASE_URL\}\/api\//g, '${API_BASE_URL}/');
      replaceInFile(fullPath, /\$\{BURGER_API_URL\}\/api\//g, '${BURGER_API_URL}/');
    }
  }
}

walk(path.join(__dirname, 'components'));
walk(path.join(__dirname, 'hooks'));
console.log('Done.');
