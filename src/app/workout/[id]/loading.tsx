import { Card } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-64 animate-pulse rounded-2xl bg-neutral-200" />
      <Card className="rounded-3xl bg-white/90 p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-8 animate-pulse rounded-2xl bg-neutral-200" />
                <div className="h-8 animate-pulse rounded-2xl bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}