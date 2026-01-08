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
      console.error(`Error getting item ${key}:`, error);
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
      console.error(`Error setting item ${key}:`, error);
      throw error;
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
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  },
};

// Derive Supabase storage key from URL
function getSupabaseStorageKey(): string | null {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('VITE_SUPABASE_URL not found, using fallback migration');
      return null;
    }
    
    // Extract project ID from URL (e.g., https://tcriouzorxknubqqnvyj.supabase.co)
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\./);
    if (match && match[1]) {
      return `sb-${match[1]}-auth-token`;
    }
    return null;
  } catch (error) {
    console.error('Error deriving Supabase storage key:', error);
    return null;
  }
}

// Find all Supabase auth tokens in localStorage (fallback)
function findSupabaseAuthTokens(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.error('Error finding Supabase auth tokens:', error);
  }
  return keys;
}

// Migrate existing localStorage session to Preferences (one-time migration)
export async function migrateSessionToNativeStorage(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    // Try to derive key from Supabase URL
    let supabaseKey = getSupabaseStorageKey();
    const keysToMigrate: string[] = [];
    
    if (supabaseKey) {
      keysToMigrate.push(supabaseKey);
    } else {
      // Fallback: find all keys matching pattern
      const foundKeys = findSupabaseAuthTokens();
      keysToMigrate.push(...foundKeys);
    }
    
    if (keysToMigrate.length === 0) {
      console.log('No Supabase auth tokens found to migrate');
      return;
    }
    
    // Migrate each key found
    for (const key of keysToMigrate) {
      try {
        // Check if we already have data in Preferences
        const { value: existingNative } = await Preferences.get({ key });
        
        if (existingNative) {
          console.log(`Session already in native storage for key: ${key}`);
          // Still remove from localStorage if it exists there
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`Removed ${key} from localStorage (already in native storage)`);
          }
          continue;
        }
        
        // Check localStorage for existing session
        const localStorageSession = localStorage.getItem(key);
        
        if (localStorageSession) {
          console.log(`Migrating session from localStorage to native storage for key: ${key}`);
          await Preferences.set({ key, value: localStorageSession });
          localStorage.removeItem(key);
          console.log(`Session migrated successfully and removed from localStorage: ${key}`);
        }
      } catch (error) {
        console.error(`Error migrating key ${key}:`, error);
        // Continue with other keys even if one fails
      }
    }
  } catch (error) {
    console.error('Error in migrateSessionToNativeStorage:', error);
  }
}
