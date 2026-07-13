const fs = require('fs');

let content = fs.readFileSync('components/Dashboard.tsx', 'utf8');

if (!content.includes('useNotifications')) {
  content = content.replace("import { API_BASE_URL }", "import { useNotifications } from '../hooks/useNotifications';\nimport { API_BASE_URL }");
  
  content = content.replace("const [isLoading, setIsLoading] = useState(true);", "const [isLoading, setIsLoading] = useState(true);\n  const { sendNotification } = useNotifications();");
  
  const target = `if (overdueTransactions.length > 0 && !hasShownModal) {
        setIsOverdueModalOpen(true);
        sessionStorage.setItem('overdueModalShown', 'true');
    }`;
    
  const injection = `if (overdueTransactions.length > 0 && !hasShownModal) {
        setIsOverdueModalOpen(true);
        sessionStorage.setItem('overdueModalShown', 'true');
        
        // Dispara a notificação
        sendNotification('Transações Recorrentes', {
           body: 'Você tem contas recorrentes/vencidas pendentes. Revise suas finanças!',
           tag: 'recurring-alert'
        });
    }`;
    
  content = content.replace(target, injection);
  
  fs.writeFileSync('components/Dashboard.tsx', content);
  console.log("DASHBOARD MODIFIED");
} else {
  console.log("ALREADY MODIFIED");
}
