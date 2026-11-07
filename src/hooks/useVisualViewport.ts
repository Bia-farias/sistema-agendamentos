import { useState, useEffect } from 'react';

export interface VisualViewportState {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

/**
 * Hook que monitora a API window.visualViewport para manter painéis fixos,
 * modais (Drawers) e o Assistente IA perfeitamente alinhados quando o teclado
 * virtual abre ou fecha no Android e iOS (iPhone).
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        offsetTop: 0,
        offsetLeft: 0,
        isKeyboardOpen: false,
        keyboardHeight: 0,
      };
    }
    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;
    const width = vv ? vv.width : window.innerWidth;
    const offsetTop = vv ? vv.offsetTop : 0;
    const offsetLeft = vv ? vv.offsetLeft : 0;
    const keyboardHeight = Math.max(0, window.innerHeight - height);

    return {
      width,
      height,
      offsetTop,
      offsetLeft,
      isKeyboardOpen: keyboardHeight > 110,
      keyboardHeight,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const updateViewport = () => {
      // Impede deslocamento horizontal da janela provocado pelo foco do teclado em mobile
      if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY);
      }

      const currentVv = window.visualViewport;
      const height = currentVv ? Math.round(currentVv.height) : window.innerHeight;
      const width = currentVv ? Math.round(currentVv.width) : window.innerWidth;
      const offsetTop = currentVv ? Math.max(0, Math.round(currentVv.offsetTop)) : 0;
      const offsetLeft = currentVv ? Math.max(0, Math.round(currentVv.offsetLeft)) : 0;

      const layoutHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, Math.round(layoutHeight - height - offsetTop));
      const isKeyboardOpen = keyboardHeight > 110;

      // Atualiza variáveis CSS globais para uso imediato no layout
      const root = document.documentElement;
      root.style.setProperty('--visual-viewport-height', `${height}px`);
      root.style.setProperty('--visual-viewport-offset-top', `${offsetTop}px`);
      root.style.setProperty('--keyboard-inset-height', `${keyboardHeight}px`);

      setState((prev) => {
        if (
          prev.height === height &&
          prev.width === width &&
          prev.offsetTop === offsetTop &&
          prev.offsetLeft === offsetLeft &&
          prev.isKeyboardOpen === isKeyboardOpen &&
          prev.keyboardHeight === keyboardHeight
        ) {
          return prev;
        }
        return {
          width,
          height,
          offsetTop,
          offsetLeft,
          isKeyboardOpen,
          keyboardHeight,
        };
      });
    };

    updateViewport();

    if (vv) {
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
    }
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return state;
}

