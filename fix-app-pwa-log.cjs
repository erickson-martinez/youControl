const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

const target = "const App: React.FC = () => {";
const injection = `const App: React.FC = () => {
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('🌍 [PWA] Evento beforeinstallprompt disparado!', e);
      e.preventDefault();
      // Mostra as plataformas onde a instalação é suportada
      console.log('🌍 [PWA] Plataformas suportadas:', e.platforms);
    };

    const handleAppInstalled = (e) => {
      console.log('✅ [PWA] Aplicativo instalado com sucesso!', e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    console.log('🔍 [PWA] Listeners de instalação registrados no App.tsx');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
`;

content = content.replace(target, injection);

fs.writeFileSync('App.tsx', content);
