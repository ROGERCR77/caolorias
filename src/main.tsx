import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import "./index.css";

// ========================================
// BUILD MARKER - Para confirmar versão
// ========================================
const BUILD_MARKER = "AUTH_PERSIST_FIX_V2_2025_01_13";

async function bootstrap() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  // Log de build marker SEMPRE (primeiro log do app)
  console.log(`[BUILD] ${BUILD_MARKER}`);
  console.log(`[BUILD] Platform: ${platform}, isNative: ${isNative}`);
  console.log(`[BUILD] Timestamp: ${new Date().toISOString()}`);
  
  if (isNative) {
    console.log('[Boot] Starting native platform initialization...');
    
    // 1. Diagnóstico do Preferences ANTES de qualquer coisa
    try {
      const { keys } = await Preferences.keys();
      const authKeys = keys.filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      console.log(`[Boot] Existing Preferences keys: ${keys.length} total`);
      console.log(`[Boot] Auth-related keys:`, authKeys);
      
      // Verificar cada auth key encontrada
      for (const key of authKeys) {
        const { value } = await Preferences.get({ key });
        console.log(`[Boot] Auth key "${key}": ${value ? `EXISTS (${value.length} chars)` : 'EMPTY'}`);
      }
      
      // Verificar a key primária explicitamente
      const primaryKey = `sb-tcriouzorxknubqqnvyj-auth-token`;
      if (!authKeys.includes(primaryKey)) {
        const { value } = await Preferences.get({ key: primaryKey });
        console.log(`[Boot] Primary key "${primaryKey}": ${value ? `EXISTS (${value.length} chars)` : 'NOT FOUND'}`);
      }
    } catch (prefError) {
      console.error('[Boot] Preferences diagnostic error:', prefError);
    }
    
    // 2. Migração de sessão
    console.log('[Boot] Starting session migration...');
    try {
      const { migrateSessionToNativeStorage } = await import("./lib/capacitorStorage");
      await migrateSessionToNativeStorage();
      console.log('[Boot] Session migration completed');
      
      // Aguardar sincronização
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('[Boot] Storage sync delay completed');
      
      // 3. Diagnóstico PÓS migração
      const { keys: postKeys } = await Preferences.keys();
      const postAuthKeys = postKeys.filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      console.log(`[Boot] POST-migration auth keys:`, postAuthKeys);
      for (const key of postAuthKeys) {
        const { value } = await Preferences.get({ key });
        console.log(`[Boot] POST "${key}": ${value ? `EXISTS (${value.length} chars)` : 'EMPTY'}`);
      }
    } catch (error) {
      console.error('[Boot] Migration error:', error);
    }
  } else {
    console.log('[Boot] Web platform - skipping native initialization');
  }

  // Só agora importa o App (após migração estar completa)
  console.log('[Boot] Importing App component...');
  const { default: App } = await import("./App");

  // Render
  console.log('[Boot] Rendering app...');
  createRoot(document.getElementById("root")!).render(<App />);
  console.log('[Boot] App rendered successfully');
}

bootstrap();
