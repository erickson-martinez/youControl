import fs from 'fs';
let content = fs.readFileSync('./components/ListPurcharsePage.tsx', 'utf8');

content = content.replace(/p\.price !== undefined \? Number\(p\.price\) : \(p\.value !== undefined \? Number\(p\.value\) : undefined\)/g, 
  "p.price != null ? Number(p.price) : (p.value != null ? Number(p.value) : undefined)");
content = content.replace(/p\.quantity !== undefined \? Number\(p\.quantity\) : undefined/g, 
  "p.quantity != null ? Number(p.quantity) : undefined");
content = content.replace(/p\.total !== undefined \? Number\(p\.total\) : \(\(p\.price !== undefined \|\| p\.value !== undefined\) && p\.quantity !== undefined \? Number\(p\.price \|\| p\.value\) \* Number\(p\.quantity\) : undefined\)/g, 
  "p.total != null ? Number(p.total) : ((p.price != null || p.value != null) && p.quantity != null ? Number(p.price || p.value) * Number(p.quantity) : undefined)");

fs.writeFileSync('./components/ListPurcharsePage.tsx', content);
