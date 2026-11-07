import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useVisualViewport } from '../../hooks/useVisualViewport';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'right' | 'left';
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  position = 'right',
  className,
}: DrawerProps) {
  const { height: viewportHeight, offsetTop: viewportOffsetTop, isKeyboardOpen } =
    useVisualViewport();
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Garante que o campo focado permaneça visível dentro do Drawer quando o teclado virtual abrir
  const handleContentFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      setTimeout(() => {
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 220);
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed left-0 right-0 flex w-full max-w-full pointer-events-none',
          position === 'right' ? 'justify-end' : 'justify-start'
        )}
        style={{
          top: `${viewportOffsetTop}px`,
          height: viewportHeight > 0 ? `${viewportHeight}px` : '100dvh',
        }}
      >
        <div
          className={cn(
            'pointer-events-auto w-full max-w-full h-full max-h-full overflow-hidden transition-transform duration-300 ease-out transform',
            sizeClasses[size],
            position === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left',
            'bg-white dark:bg-[#13101e] sm:border-l border-violet-100 dark:border-violet-900/30 shadow-2xl flex flex-col',
            className
          )}
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-violet-100/60 dark:border-violet-900/20 flex items-start justify-between gap-3 bg-violet-50/20 dark:bg-violet-950/10 shrink-0">
            <div className="min-w-0">
              {title && (
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors -mr-1 shrink-0"
              aria-label="Fechar painel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            onFocusCapture={handleContentFocusCapture}
            className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 sm:p-6 space-y-5"
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div
              className={cn(
                'px-4 sm:px-6 border-t border-violet-100/60 dark:border-violet-900/20 bg-violet-50/20 dark:bg-violet-950/10 flex items-center justify-end gap-3 shrink-0',
                isKeyboardOpen
                  ? 'py-2.5'
                  : 'pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom,0px))]'
              )}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
