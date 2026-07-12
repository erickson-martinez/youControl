const fs = require('fs');

const path = 'components/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `{isInstallable && (`;
const injection = `
              {notifPermission !== 'granted' && (
                <button
                   onClick={requestPermission}
                   className="flex items-center w-full px-4 py-3 text-sm font-medium text-white transition-colors rounded-lg bg-yellow-600 hover:bg-yellow-700 mb-2"
                 >
                   <BellIcon className="w-6 h-6" />
                   <span className="ml-3">Ativar Notificações</span>
                 </button>
              )}
`;

content = content.replace(target, injection + target);
fs.writeFileSync(path, content);
