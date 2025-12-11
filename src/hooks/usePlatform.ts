import { Capacitor } from '@capacitor/core';

export const usePlatform = () => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isWeb = platform === 'web';

  return {
    platform,
    isNative,
    isIOS,
    isAndroid,
    isWeb,
  };
};
