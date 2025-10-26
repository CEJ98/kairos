export default function Loading() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="h-6 w-56 rounded-full bg-neutral-200" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-3xl bg-neutral-100" />
        ))}
      </div>
      <div className="h-96 rounded-3xl bg-neutral-100" />
    </div>
  );
}