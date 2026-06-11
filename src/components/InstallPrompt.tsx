import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('ats_install_dismissed') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isStandalone || hasDismissed) {
      return;
    }

    const ua = window.navigator.userAgent;
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOSDevice = isIPad || isIPhone;
    
    if (isIOSDevice) {
      setIsIOS(true);
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('ats_install_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[#E8521A]/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)] max-w-md mx-auto relative overflow-hidden">
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-text-muted hover:text-text transition-colors p-1"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8521A] to-[#ff7a45] flex items-center justify-center text-white flex-shrink-0 shadow-lg">
            <Download size={24} />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="font-bold text-text text-sm sm:text-base">Instalar la App Oficial</h3>
            
            {isIOS ? (
              <div className="mt-1.5 text-xs text-text-subtle space-y-1.5">
                <p>Para instalar en tu iPhone:</p>
                <ol className="list-decimal pl-4 space-y-1 text-text-muted">
                  <li>Toca el botón <Share size={12} className="inline mx-0.5" /> <b>Compartir</b> abajo.</li>
                  <li>Selecciona <PlusSquare size={12} className="inline mx-0.5" /> <b>Agregar a inicio</b>.</li>
                </ol>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-text-muted">
                  Acceso rápido, resultados al instante y funciona sin conexión.
                </p>
                <button 
                  onClick={handleInstall}
                  className="mt-3 bg-[#E8521A] hover:bg-[#ff6b36] text-white text-xs font-bold uppercase tracking-wide py-2 px-4 rounded-lg transition-colors w-full sm:w-auto"
                >
                  Instalar ahora
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}