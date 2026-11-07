import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options = [], children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full min-w-0 space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider truncate"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center min-w-0">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full min-w-0 max-w-full appearance-none rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-base sm:text-sm px-3.5 py-2.5 pr-10 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 dark:focus:border-violet-400',
              error && 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
              className
            )}
            {...props}
          >
            {children ||
              options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-zinc-400">
            <ChevronDown size={16} />
          </div>
        </div>
        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
