import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isDev = import.meta.env.DEV;

// Storage adapter that uses Capacitor Preferences on native platforms
// and localStorage on web for Supabase session persistence
export const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        if (isDev) console.log(`[Storage] getItem called for key: "${key}"`);
        let { value } = await Preferences.get({ key });
        
        // Fallback: if not found and it's an auth key, search for any sb-*-auth-token
        if (!value && key.endsWith('-auth-token')) {
          if (isDev) console.log(`[Storage] Primary key not found, searching for any auth token...`);
          const { keys } = await Preferences.keys();
          if (isDev) console.log(`[Storage] All Preferences keys:`, keys);
          
          const authKeys = keys.filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (isDev) console.log(`[Storage] Found auth keys:`, authKeys);
          
          if (authKeys.length > 0) {
            // Tentar todas as keys encontradas
            for (const authKey of authKeys) {
              const fallbackResult = await Preferences.get({ key: authKey });
              if (fallbackResult.value) {
                if (isDev) console.log(`[Storage] Using fallback key: "${authKey}" (${fallbackResult.value.length} chars)`);
                // CORREÇÃO: Salvar também na key primária para próxima vez
                await Preferences.set({ key, value: fallbackResult.value });
                value = fallbackResult.value;
                break;
              }
            }
          }
        }
        
        if (isDev) console.log(`[Storage] getItem "${key}": ${value ? 'FOUND (' + value.length + ' chars)' : 'NOT FOUND'}`);
        return value ?? null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[Storage] getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Capacitor.isNativePlatform()) {
        if (isDev) console.log(`[Storage] setItem called for key: "${key}" (${value.length} chars)`);
        await Preferences.set({ key, value });
        if (isDev) console.log(`[Storage] setItem "${key}": SUCCESS`);
        
        // Verificar se foi salvo corretamente
        const verify = await Preferences.get({ key });
        if (verify.value !== value) {
          console.error(`[Storage] WARNING: Value mismatch after save!`);
        } else {
          if (isDev) console.log(`[Storage] Verified: Value saved correctly`);
        }
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('[Storage] setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Capacitor.isNativePlatform()) {
        // ALERTA: removeItem está sendo chamado - isso pode indicar logout ou sessão inválida
        if (isDev) console.warn(`[Storage] removeItem called for key: "${key}"`);
        if (isDev) console.warn(`[Storage] This usually means: SIGNED_OUT event or invalid session`);
        
        // Capturar stack trace para debug
        try {
          throw new Error('removeItem stack trace');
        } catch (e) {
          if (isDev) console.log(`[Storage] removeItem called from:`, (e as Error).stack?.split('\n').slice(1, 4).join('\n'));
        }
        
        await Preferences.remove({ key });
        if (isDev) console.log(`[Storage] removeItem "${key}": COMPLETED`);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('[Storage] removeItem error:', error);
    }
  },
};

// Derivar a chave do Supabase a partir da URL
function getSupabaseAuthKey(): string {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.(co|in)/);
  const ref = match ? match[1] : 'pduddriicbprkflkuyjk';
  return `sb-${ref}-auth-token`;
}

// Buscar chave de sessão Supabase no localStorage (fallback seguro)
function findAuthTokenInLocalStorage(): { key: string; value: string } | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Só migrar chaves que seguem o padrão Supabase: sb-*-auth-token
    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
      const value = localStorage.getItem(key);
      if (value) return { key, value };
    }
  }
  return null;
}

// Migrate existing localStorage session to Preferences (one-time migration)
export async function migrateSessionToNativeStorage(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const primaryKey = getSupabaseAuthKey();
  if (isDev) console.log(`[Migration] Primary key: ${primaryKey}`);

  try {
    // Já existe no storage nativo?
    const { value: existingNative } = await Preferences.get({ key: primaryKey });
    if (existingNative) {
      if (isDev) console.log('[Migration] Session already in native storage');
      return;
    }

    // Tentar chave primária no localStorage
    let sessionData = localStorage.getItem(primaryKey);
    let foundKey = primaryKey;

    // Fallback: buscar qualquer chave sb-*-auth-token
    if (!sessionData) {
      const found = findAuthTokenInLocalStorage();
      if (found) {
        sessionData = found.value;
        foundKey = found.key;
        if (isDev) console.log(`[Migration] Found session in localStorage with key: ${foundKey}`);
      }
    }

    if (sessionData) {
      if (isDev) console.log(`[Migration] Migrating session from localStorage (${foundKey})`);

      // Salvar na key primária
      await Preferences.set({ key: primaryKey, value: sessionData });
      if (isDev) console.log(`[Migration] Saved to primary key: ${primaryKey}`);
      
      // Se encontrou outra key, salvar nela também (evita mismatch)
      if (foundKey && foundKey !== primaryKey) {
        await Preferences.set({ key: foundKey, value: sessionData });
        if (isDev) console.log(`[Migration] Also saved to fallback key: ${foundKey}`);
      }
      
      // NÃO remover do localStorage ainda (safe mode)
      if (isDev) console.log('[Migration] Session migrated successfully (safe mode - localStorage kept)');
    } else {
      if (isDev) console.log('[Migration] No session found in localStorage');
    }
  } catch (error) {
    console.error('[Migration] Error:', error);
  }
}
