// Unified Supabase client that uses the correct storage based on platform
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { capacitorStorage } from '@/lib/capacitorStorage';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Extract project ref from URL for consistent storage key
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase/)?.[1] || 'tcriouzorxknubqqnvyj';
const STORAGE_KEY = `sb-${projectRef}-auth-token`;

// CORREÇÃO CRÍTICA: Criar o client de forma lazy para garantir que a migração já rodou
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    // Verificar novamente no momento da criação (não só no import)
    const isNative = Capacitor.isNativePlatform();
    
    console.log('[SupabaseClient] Creating client (lazy init)...', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY,
      projectRef,
      storageKey: STORAGE_KEY,
      isNative,
      storageType: isNative ? 'Preferences' : 'localStorage'
    });
    
    supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: isNative ? capacitorStorage : localStorage,
        storageKey: STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !isNative,
      }
    });
  }
  
  return supabaseInstance;
}

// Export como Proxy para garantir lazy initialization
// O client só será criado quando realmente usado, após a migração ter rodado
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    
    // Se for uma função, bind para manter o contexto
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  }
});
