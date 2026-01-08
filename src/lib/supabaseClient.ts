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

// Log para diagnóstico
console.log('[SupabaseClient] Initializing...', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_KEY,
  projectRef,
  storageKey: STORAGE_KEY,
  isNative: Capacitor.isNativePlatform()
});

// Single client that uses native storage on mobile (Capacitor Preferences)
// and localStorage on web - ensures session persists across app restarts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: Capacitor.isNativePlatform() ? capacitorStorage : localStorage,
    storageKey: STORAGE_KEY, // Explicit key for consistency across platforms
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !Capacitor.isNativePlatform(), // false on native, true on web
  }
});
