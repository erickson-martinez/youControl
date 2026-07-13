const fs = require('fs');

let content = fs.readFileSync('components/Dashboard.tsx', 'utf8');

// add import
if (!content.includes('usePWAInstall')) {
  content = content.replace("import { useNotifications } from '../hooks/useNotifications';", "import { useNotifications } from '../hooks/useNotifications';\nimport { usePWAInstall } from '../hooks/usePWAInstall';");
  
  // add hook usage
  const targetHook = "const { sendNotification } = useNotifications();";
  content = content.replace(targetHook, "const { sendNotification } = useNotifications();\n  const { isInstallable, installPWA } = usePWAInstall();");
  
  // add button at the bottom of the component render
  const targetRender = "      <PendingApprovalModal";
  const buttonCode = `      {isInstallable && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-11/12 max-w-md">
          <button
            onClick={installPWA}
            className="w-full py-3 px-4 bg-blue-accent hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300 animate-bounce"
            style={{ animationIterationCount: 3 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Instalar App (Acesso Rápido)
          </button>
        </div>
      )}
      <PendingApprovalModal`;
  content = content.replace(targetRender, buttonCode);

  fs.writeFileSync('components/Dashboard.tsx', content);
  console.log("MODIFIED");
} else {
  console.log("ALREADY MODIFIED");
}
