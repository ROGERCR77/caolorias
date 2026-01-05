import { ReactNode } from 'react';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';

interface Props {
  children: ReactNode;
}

export function NativeNavigationProvider({ children }: Props) {
  useSwipeBack();
  useAndroidBackButton();
  return <>{children}</>;
}
