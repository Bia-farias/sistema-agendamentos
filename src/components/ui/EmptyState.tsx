import React from 'react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  illustration,
  badge,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  size = 'md',
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20 transition-all',
        size === 'sm' && 'p-5 sm:p-6',
        size === 'md' && 'p-8 lg:p-12',
        size === 'lg' && 'p-10 lg:p-16',
        className
      )}
    >
      {illustration ? (
        <div className="mb-4 flex items-center justify-center">{illustration}</div>
      ) : icon ? (
        <div className="relative mb-4">
          <div className="absolute -inset-1.5 rounded-3xl bg-violet-500/5 dark:bg-violet-500/10 blur-xs pointer-events-none" />
          <div
            className={cn(
              'relative rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-200/60 dark:border-violet-500/20 shadow-xs',
              size === 'sm' ? 'w-11 h-11' : 'w-14 h-14'
            )}
          >
            {icon}
          </div>
        </div>
      ) : null}

      {badge && (
        <span className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/20">
          {badge}
        </span>
      )}

      <h3
        className={cn(
          'font-bold text-zinc-900 dark:text-zinc-100',
          size === 'sm' ? 'text-sm' : 'text-base'
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          'text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed',
          size === 'sm' ? 'text-xs max-w-xs' : 'text-xs sm:text-sm max-w-md'
        )}
      >
        {description}
      </p>

      {children && <div className="mt-4 w-full max-w-md">{children}</div>}

      {((actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction)) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction} leftIcon={actionIcon}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button size="sm" variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
