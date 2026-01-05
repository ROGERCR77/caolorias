import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const EDGE_WIDTH = 20;
const THRESHOLD = 60;
const ROOT_ROUTES = ['/', '/app/hoje', '/vet/dashboard', '/login'];

export function useSwipeBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const cancelled = useRef(false);

  const isRootRoute = ROOT_ROUTES.includes(location.pathname);

  // Verifica se o elemento tem scroll horizontal ou opt-out
  const shouldIgnoreTarget = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    
    // Verifica data attributes de opt-out
    const optOutElement = (target as Element).closest(
      '[data-no-swipe-back], [data-carousel], [data-horizontal-scroll], [data-embla-container]'
    );
    if (optOutElement) return true;

    // Verifica se está dentro de elemento com overflow-x scroll
    let el = target as Element | null;
    while (el) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        // Só ignora se realmente tem conteúdo scrollável
        if (el.scrollWidth > el.clientWidth) return true;
      }
      el = el.parentElement;
    }
    return false;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    cancelled.current = false;

    // Só ativa se começar na borda esquerda
    if (touch.clientX > EDGE_WIDTH) return;

    // Verifica opt-out por elemento
    if (shouldIgnoreTarget(e.target)) {
      cancelled.current = true;
      return;
    }

    startX.current = touch.clientX;
    startY.current = touch.clientY;
  }, [shouldIgnoreTarget]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (cancelled.current || startX.current === null) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - (startY.current ?? 0));

    // Cancela se: arrastou pra esquerda, ou movimento mais vertical
    if (deltaX < 0 || deltaY > Math.abs(deltaX)) {
      cancelled.current = true;
      startX.current = null;
      startY.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (cancelled.current || startX.current === null) {
      startX.current = null;
      startY.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - (startY.current ?? 0));

    startX.current = null;
    startY.current = null;

    // Valida: arrastou suficiente e mais horizontal que vertical
    if (deltaX > THRESHOLD && deltaY < deltaX / 2) {
      navigate(-1);
    }
  }, [navigate]);

  useEffect(() => {
    // Só iOS nativo
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') return;

    // Não ativa em rotas raiz ou se não há histórico pra voltar
    if (isRootRoute || window.history.length <= 1) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRootRoute, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
