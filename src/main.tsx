import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "./index.css";

async function bootstrap() {
  // 1. Migração ANTES de qualquer import que use Supabase
  if (Capacitor.isNativePlatform()) {
    console.log('[Boot] Starting session migration...');
    try {
      const { migrateSessionToNativeStorage } = await import("./lib/capacitorStorage");
      await migrateSessionToNativeStorage();
      console.log('[Boot] Session migration completed');
      
      // Aguardar um tick para garantir que o storage está sincronizado
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('[Boot] Migration error:', error);
    }
  }

  // 2. Só agora importa o App (após migração estar completa)
  const { default: App } = await import("./App");

  // 3. Render
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
