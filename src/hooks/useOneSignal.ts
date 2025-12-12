import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Obtém o OneSignal do window (injetado pelo plugin Cordova)
const getOneSignal = () => {
  if (!Capacitor.isNativePlatform()) return null;
  return (window as any)?.plugins?.OneSignal || null;
};

export const useOneSignal = () => {
  const isNative = Capacitor.isNativePlatform();

  const setExternalUserId = useCallback((userId: string) => {
    if (!isNative) return;
    
    const os = getOneSignal();
    if (!os) {
      console.log("OneSignal not available for setExternalUserId");
      return;
    }

    try {
      os.login(userId);
      console.log("OneSignal external user ID set:", userId);
    } catch (e) {
      console.log("OneSignal setExternalUserId error:", e);
    }
  }, [isNative]);

  const removeExternalUserId = useCallback(() => {
    if (!isNative) return;
    
    const os = getOneSignal();
    if (!os) return;

    try {
      os.logout();
      console.log("OneSignal external user ID removed");
    } catch (e) {
      console.log("OneSignal logout error:", e);
    }
  }, [isNative]);

  const sendTags = useCallback((tags: Record<string, string | number>) => {
    if (!isNative) return;
    
    const os = getOneSignal();
    if (!os) return;

    try {
      os.User.addTags(tags);
      console.log("OneSignal tags sent:", tags);
    } catch (e) {
      console.log("OneSignal sendTags error:", e);
    }
  }, [isNative]);

  const trackMealLogged = useCallback((dogName: string) => {
    sendTags({
      last_meal_logged: new Date().toISOString(),
      dog_name: dogName
    });
  }, [sendTags]);

  const trackWeightLogged = useCallback((dogName: string, weightKg: number) => {
    sendTags({
      last_weight_logged: new Date().toISOString(),
      dog_name: dogName,
      last_weight_kg: weightKg
    });
  }, [sendTags]);

  return {
    isNative,
    setExternalUserId,
    removeExternalUserId,
    sendTags,
    trackMealLogged,
    trackWeightLogged
  };
};
