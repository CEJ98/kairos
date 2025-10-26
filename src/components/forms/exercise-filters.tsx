'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface ExerciseFiltersProps {
  muscles: string[];
  equipment: string[];
}

export function ExerciseFilters({ muscles, equipment }: ExerciseFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const handleChange = (key: string, value: string) => {
    const search = new URLSearchParams(params);
    if (value) {
      search.set(key, value);
    } else {
      search.delete(key);
    }
    router.push(`/exercises?${search.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white/70 p-4 shadow-soft">
      <label className="text-sm font-medium text-neutral-500">
        Músculo
        <select
          className="ml-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm focus:border-accent-teal"
          value={params.get('muscle') ?? ''}
          onChange={(event) => handleChange('muscle', event.target.value)}
        >
          <option value="">Todos</option>
          {muscles.map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-neutral-500">
        Equipo
        <select
          className="ml-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm focus:border-accent-teal"
          value={params.get('equipment') ?? ''}
          onChange={(event) => handleChange('equipment', event.target.value)}
        >
          <option value="">Todos</option>
          {equipment.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
