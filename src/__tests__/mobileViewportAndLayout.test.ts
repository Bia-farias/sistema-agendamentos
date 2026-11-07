import { describe, it, expect } from 'vitest';
import appLayoutRaw from '../components/layout/AppLayout.tsx?raw';
import mobileBottomNavRaw from '../components/layout/MobileBottomNav.tsx?raw';
import authLayoutRaw from '../components/layout/AuthLayout.tsx?raw';
import aiChatPanelRaw from '../components/ai/AIChatPanel.tsx?raw';
import aiFloatingButtonRaw from '../components/ai/AIFloatingButton.tsx?raw';
import drawerRaw from '../components/ui/Drawer.tsx?raw';
import inputRaw from '../components/ui/Input.tsx?raw';
import selectRaw from '../components/ui/Select.tsx?raw';
import visualViewportHookRaw from '../hooks/useVisualViewport.ts?raw';

describe('Mobile Layout, VisualViewport & Virtual Keyboard Stability (Android & iPhone)', () => {
  it('provides useVisualViewport hook that tracks visualViewport resize/scroll and prevents horizontal drift', () => {
    expect(visualViewportHookRaw).toContain('window.visualViewport');
    expect(visualViewportHookRaw).toContain('--visual-viewport-height');
    expect(visualViewportHookRaw).toContain('--visual-viewport-offset-top');
    expect(visualViewportHookRaw).toContain('window.scrollTo(0, window.scrollY)');
  });

  it('hides MobileBottomNav and AIFloatingButton when virtual keyboard is open on mobile and applies safe-area-inset-bottom', () => {
    expect(mobileBottomNavRaw).toContain('useVisualViewport');
    expect(mobileBottomNavRaw).toContain('isKeyboardOpen');
    expect(mobileBottomNavRaw).toContain('env(safe-area-inset-bottom,0px)');
    expect(aiFloatingButtonRaw).toContain('useVisualViewport');
    expect(aiFloatingButtonRaw).toContain('isKeyboardOpen');
    expect(authLayoutRaw).toContain('min-h-dvh-safe');
    expect(authLayoutRaw).toContain('overflow-x-hidden');
  });

  it('eliminates w-screen and 100vh overflow from AppLayout and integrates useVisualViewport + focus scroll handling', () => {
    expect(appLayoutRaw).not.toContain('w-screen');
    expect(appLayoutRaw).toContain('h-dvh-safe');
    expect(appLayoutRaw).toContain('w-full max-w-full overflow-hidden');
    expect(appLayoutRaw).toContain('useVisualViewport');
    expect(appLayoutRaw).toContain('scrollIntoView');
  });

  it('keeps AIChatPanel bounded to visualViewport with fixed header, scrollable messages (min-h-0), and bottom input above virtual keyboard', () => {
    expect(aiChatPanelRaw).toContain('useVisualViewport');
    expect(aiChatPanelRaw).toContain('viewportOffsetTop');
    expect(aiChatPanelRaw).toContain('viewportHeight');
    // Header fixed at top
    expect(aiChatPanelRaw).toContain('shrink-0');
    // Independent message scrolling with min-h-0 and overscroll-contain
    expect(aiChatPanelRaw).toContain('flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain');
    // Safe area bottom + keyboard adaptation on input container
    expect(aiChatPanelRaw).toContain('env(safe-area-inset-bottom,0px)');
    // Prevents focus loss when clicking Send button on mobile
    expect(aiChatPanelRaw).toContain('onMouseDown={(e) => e.preventDefault()}');
  });

  it('synchronizes Drawer modals (registration inputs & textareas) with visualViewport and scrolls focused fields into view', () => {
    expect(drawerRaw).not.toContain('w-screen');
    expect(drawerRaw).toContain('useVisualViewport');
    expect(drawerRaw).toContain('viewportOffsetTop');
    expect(drawerRaw).toContain('viewportHeight');
    expect(drawerRaw).toContain('handleContentFocusCapture');
    expect(drawerRaw).toContain('scrollIntoView');
    expect(drawerRaw).toContain('flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain');
  });

  it('prevents Input and Select components from overflowing flex/grid containers on narrow mobile viewports', () => {
    expect(inputRaw).toContain('min-w-0 max-w-full');
    expect(inputRaw).toContain('text-base sm:text-sm');
    expect(selectRaw).toContain('min-w-0 max-w-full');
    expect(selectRaw).toContain('text-base sm:text-sm');
  });
});
