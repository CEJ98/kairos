interface StatProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
}

export function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <span className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <span className="font-display text-3xl font-bold text-foreground">{value}</span>
    </div>
  );
}
