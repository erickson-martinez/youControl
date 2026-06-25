const fs = require('fs');
const path = require('path');

const filePatterns = [
  { match: /\bbg-gray-900\b/g, replace: 'bg-gray-50 dark:bg-gray-900' },
  { match: /\bbg-gray-800\b/g, replace: 'bg-white dark:bg-gray-800' },
  { match: /\bbg-gray-700\b/g, replace: 'bg-gray-100 dark:bg-gray-700' },
  { match: /\bborder-gray-700\b/g, replace: 'border-gray-200 dark:border-gray-700' },
  { match: /\bborder-gray-600\b/g, replace: 'border-gray-300 dark:border-gray-600' },
  { match: /\btext-white\b/g, replace: 'text-gray-900 dark:text-white' },
  { match: /\btext-gray-300\b/g, replace: 'text-gray-700 dark:text-gray-300' },
  { match: /\btext-gray-400\b/g, replace: 'text-gray-500 dark:text-gray-400' },
  { match: /\bring-gray-700\b/g, replace: 'ring-gray-200 dark:ring-gray-700' },
  { match: /\btext-gray-100\b/g, replace: 'text-gray-900 dark:text-gray-100' }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Prevent double replacing if script is run multiple times
  if (content.includes('dark:bg-gray-900')) {
      // return;
  }
  
  for (const pattern of filePatterns) {
    // Only replace if not already preceded by dark:
    // This regex looks behind for dark:, but JS lookbehind is supported in Node.
    const regex = new RegExp(`(?<!dark:)${pattern.match.source}`, 'g');
    content = content.replace(regex, pattern.replace);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk('./components');
processFile('./App.tsx');
processFile('./index.html');
