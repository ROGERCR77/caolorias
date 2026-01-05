import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

const ROOT_ROUTES = ['/', '/app/hoje', '/vet/dashboard', '/login'];

export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    let listenerHandle: { remove: () => Promise<void> } | null = null;

    const setupListener = async () => {
      listenerHandle = await App.addListener('backButton', () => {
        // 1. Verifica se há modal/drawer aberto (Radix/Vaul usam data-state="open")
        const openOverlay = document.querySelector(
          '[data-state="open"][role="dialog"], [data-vaul-drawer][data-state="open"]'
        );
        
        if (openOverlay) {
          // Tenta fechar via ESC (Radix escuta isso)
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          return;
        }

        // 2. Se rota raiz: double-tap-to-exit
        if (ROOT_ROUTES.includes(location.pathname)) {
          const now = Date.now();
          if (now - lastBackPress.current < 2000) {
            App.exitApp();
          } else {
            lastBackPress.current = now;
            toast.info('Toque novamente para sair', { duration: 2000 });
          }
          return;
        }

        // 3. Rota interna: voltar
        if (window.history.length > 1) {
          navigate(-1);
        }
      });
    };

    setupListener();

    return () => { 
      listenerHandle?.remove(); 
    };
  }, [location.pathname, navigate]);
}
