import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "./index.css";

async function bootstrap() {
  // CORREÇÃO CRÍTICA: Migração ANTES de QUALQUER import que possa usar Supabase
  if (Capacitor.isNativePlatform()) {
    console.log('[Boot] Starting session migration...');
    try {
      const { migrateSessionToNativeStorage } = await import("./lib/capacitorStorage");
      await migrateSessionToNativeStorage();
      console.log('[Boot] Session migration completed');
      
      // Aguardar mais tempo para garantir sincronização completa do storage
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('[Boot] Storage sync delay completed');
    } catch (error) {
      console.error('[Boot] Migration error:', error);
    }
  }

  // Só agora importa o App (após migração estar completa)
  const { default: App } = await import("./App");

  // Render
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
