import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "./index.css";

async function bootstrap() {
  // 1. Migrar sessão ANTES de importar o App (que importa supabaseClient)
  if (Capacitor.isNativePlatform()) {
    const { migrateSessionToNativeStorage } = await import("./lib/capacitorStorage");
    await migrateSessionToNativeStorage();
  }

  // 2. Só agora importa o App (após migração estar completa)
  const { default: App } = await import("./App");

  // 3. Render
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
