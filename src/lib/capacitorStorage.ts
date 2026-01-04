import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Storage adapter that uses Capacitor Preferences on native platforms
// and localStorage on web for Supabase session persistence
export const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};

// Migrate existing localStorage session to Preferences (one-time migration)
export async function migrateSessionToNativeStorage(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  const supabaseKey = 'sb-tcriouzorxknubqqnvyj-auth-token';
  
  try {
    // Check if we already have data in Preferences
    const { value: existingNative } = await Preferences.get({ key: supabaseKey });
    
    if (existingNative) {
      console.log('Session already in native storage');
      return;
    }
    
    // Check localStorage for existing session
    const localStorageSession = localStorage.getItem(supabaseKey);
    
    if (localStorageSession) {
      console.log('Migrating session from localStorage to native storage');
      await Preferences.set({ key: supabaseKey, value: localStorageSession });
      console.log('Session migrated successfully');
    }
  } catch (error) {
    console.error('Error migrating session:', error);
  }
}
