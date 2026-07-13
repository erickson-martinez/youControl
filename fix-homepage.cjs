const fs = require('fs');

let content = fs.readFileSync('components/HomePage.tsx', 'utf8');

if (!content.includes('InstallPWAButton')) {
  content = content.replace("import React, { useState, useEffect, useMemo } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';\nimport InstallPWAButton from './InstallPWAButton';");
  
  // Find where to place the button. We can place it at the very bottom of the render return.
  const target = '        </div>\n    );';
  const injection = '            <InstallPWAButton />\n        </div>\n    );';
  
  content = content.replace(target, injection);
  fs.writeFileSync('components/HomePage.tsx', content);
  console.log("MODIFIED");
} else {
  console.log("ALREADY MODIFIED");
}
