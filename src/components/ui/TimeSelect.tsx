import React from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TimeSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'size'> {
  value: string;
  onChange: (value: string) => void;
  /** Intervalo entre opções em minutos (padrão: 15) */
  step?: number;
  /** Primeiro horário disponível (HH:mm, padrão: 05:00) */
  min?: string;
  /** Último horário disponível (HH:mm, padrão: 23:45) */
  max?: string;
  size?: 'sm' | 'md';
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Gera a lista de horários agrupada por período do dia. */
export function buildTimeOptions(step = 15, min = '05:00', max = '23:45', current?: string) {
  const start = toMinutes(min);
  const end = toMinutes(max);
  const set = new Set<string>();
  for (let t = start; t <= end; t += step) set.add(toTime(t));
  if (current && /^\d{2}:\d{2}$/.test(current)) set.add(current);

  const all = Array.from(set).sort((a, b) => toMinutes(a) - toMinutes(b));
  const groups: { label: string; times: string[] }[] = [
    { label: '🌅 Manhã', times: all.filter((t) => toMinutes(t) < 12 * 60) },
    { label: '☀️ Tarde', times: all.filter((t) => toMinutes(t) >= 12 * 60 && toMinutes(t) < 18 * 60) },
    { label: '🌙 Noite', times: all.filter((t) => toMinutes(t) >= 18 * 60) },
  ];
  return groups.filter((g) => g.times.length > 0);
}

export function TimeSelect({
  value,
  onChange,
  step = 15,
  min = '05:00',
  max = '23:45',
  size = 'md',
  className,
  ...props
}: TimeSelectProps) {
  const groups = buildTimeOptions(step, min, max, value);

  return (
    <div className="relative flex items-center min-w-0">
      <Clock
        size={size === 'sm' ? 13 : 15}
        className="absolute left-3 pointer-events-none text-violet-500"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full min-w-0 appearance-none rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 font-semibold tabular-nums cursor-pointer transition-all',
          'focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400',
          size === 'sm' ? 'text-xs pl-8 pr-8 py-2' : 'text-sm pl-9 pr-9 py-2.5',
          className
        )}
        {...props}
      >
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.times.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown
        size={size === 'sm' ? 13 : 15}
        className="absolute right-3 pointer-events-none text-zinc-400"
      />
    </div>
  );
}
