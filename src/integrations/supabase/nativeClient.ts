// Native Supabase client with persistent storage for Capacitor apps
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { capacitorStorage } from '@/lib/capacitorStorage';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create a Supabase client that uses native storage on mobile platforms
// This ensures sessions persist even when the app is fully closed
export const supabaseNative = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: Capacitor.isNativePlatform() ? capacitorStorage : localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !Capacitor.isNativePlatform(), // Only detect URL sessions on web
  }
});
