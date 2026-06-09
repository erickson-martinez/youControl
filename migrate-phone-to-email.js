import fs from 'fs';
import path from 'path';

const replaceInFile = (filePath) => {
  const code = fs.readFileSync(filePath, 'utf-8');
  let newCode = code;

  // Replace commonly used object properties and variables
  newCode = newCode.replace(/user\.phone/g, 'user.email');
  newCode = newCode.replace(/currentUser\.phone/g, 'currentUser.email');
  newCode = newCode.replace(/\bphone:/g, 'email:');
  newCode = newCode.replace(/\bphone\s*=/g, 'email =');
  newCode = newCode.replace(/userPhone/g, 'userEmail');
  newCode = newCode.replace(/employeePhone/g, 'employeeEmail');
  newCode = newCode.replace(/ownerPhone/g, 'ownerEmail');
  newCode = newCode.replace(/telefone/g, 'email'); // For typescript properties or local vars like 'telefone' => 'email'
  newCode = newCode.replace(/Telefone/g, 'Email');
  newCode = newCode.replace(/setPhone/g, 'setEmail');
  newCode = newCode.replace(/getPhone/g, 'getEmail');
  
  // Specific API changes (we replace ?phone= with ?email= just in case)
  newCode = newCode.replace(/\?phone=/g, '?email=');
  newCode = newCode.replace(/&phone=/g, '&email=');
  newCode = newCode.replace(/\/phone\//g, '/email/');

  if (code !== newCode) {
    fs.writeFileSync(filePath, newCode);
    console.log(`Updated ${filePath}`);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.includes('node_modules') || file.includes('.git') || file.includes('dist')) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      replaceInFile(filePath);
    }
  }
};

walkSync('./components');
walkSync('./services');
replaceInFile('./App.tsx');
replaceInFile('./types.ts');
