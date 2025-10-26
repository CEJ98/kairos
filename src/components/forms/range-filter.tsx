'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const ranges = [
  { value: '8w', label: '8 semanas' },
  { value: '12w', label: '12 semanas' },
  { value: '24w', label: '24 semanas' }
];

export function RangeFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('range') ?? '8w';

  return (
    <div className="flex gap-2 rounded-full bg-white/70 p-1">
      {ranges.map((range) => (
        <button
          key={range.value}
          type="button"
          onClick={() => {
            const search = new URLSearchParams(params);
            search.set('range', range.value);
            router.push(`/progress?${search.toString()}`);
          }}
          className={cn(
            'rounded-full px-4 py-2 text-xs font-semibold transition',
            current === range.value ? 'bg-foreground text-background' : 'text-neutral-500'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
