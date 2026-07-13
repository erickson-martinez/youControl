const fs = require('fs');

let content = fs.readFileSync('components/SettingsPage.tsx', 'utf8');

if (!content.includes('useNotifications')) {
  content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useNotifications } from '../hooks/useNotifications';");
  
  content = content.replace("const [error, setError] = useState<string | null>(null);", "const [error, setError] = useState<string | null>(null);\n  const { sendNotification } = useNotifications();");
  
  const targetBtn = `<h1 className="text-2xl font-bold text-white">Gerenciar Permissões</h1>`;
  const injectionBtn = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-white">Configurações Gerais</h1>
                    <button 
                        onClick={() => sendNotification('Transações Recorrentes', { body: 'Você tem contas recorrentes pendentes.', tag: 'recurring-alert' })}
                        className="px-4 py-2 font-medium text-white transition-colors bg-purple-600 rounded-md hover:bg-purple-700"
                    >
                        Testar Notificação Recorrente
                    </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-300 mt-6">Gerenciar Permissões</h2>`;
                
  content = content.replace(targetBtn, injectionBtn);
  fs.writeFileSync('components/SettingsPage.tsx', content);
  console.log("SETTINGS MODIFIED");
} else {
  console.log("ALREADY MODIFIED");
}
