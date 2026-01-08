import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "./index.css";

async function bootstrap() {
  // 1. Diagnóstico e migração de sessão ANTES de importar o App
  if (Capacitor.isNativePlatform()) {
    const { Preferences } = await import('@capacitor/preferences');
    
    // Diagnóstico: listar todas as keys existentes
    const { keys } = await Preferences.keys();
    console.log('[Boot] Existing Preferences keys:', keys);
    
    // Verificar especificamente a key de auth esperada
    const authKey = 'sb-tcriouzorxknubqqnvyj-auth-token';
    const { value } = await Preferences.get({ key: authKey });
    console.log(`[Boot] Auth key "${authKey}": ${value ? 'EXISTS (' + value.length + ' chars)' : 'NOT FOUND'}`);
    
    // Migração de sessão do localStorage para Preferences
    const { migrateSessionToNativeStorage } = await import("./lib/capacitorStorage");
    await migrateSessionToNativeStorage();
  }

  // 2. Só agora importa o App (após migração estar completa)
  const { default: App } = await import("./App");

  // 3. Render
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
