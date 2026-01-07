import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Storage adapter that uses Capacitor Preferences on native platforms
// and localStorage on web for Supabase session persistence
export const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
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
        await Preferences.set({ key, value });
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
        await Preferences.remove({ key });
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
  const ref = match ? match[1] : 'tcriouzorxknubqqnvyj';
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

  try {
    // Já existe no storage nativo?
    const { value: existingNative } = await Preferences.get({ key: primaryKey });
    if (existingNative) {
      console.log('[Migration] Session already in native storage');
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
      }
    }

    if (sessionData) {
      console.log(`[Migration] Migrating session from localStorage (${foundKey})`);
      await Preferences.set({ key: primaryKey, value: sessionData });
      // Remover do localStorage após migrar para evitar duplicação
      localStorage.removeItem(foundKey);
      console.log('[Migration] Session migrated successfully');
    } else {
      console.log('[Migration] No session found in localStorage');
    }
  } catch (error) {
    console.error('[Migration] Error:', error);
  }
}
