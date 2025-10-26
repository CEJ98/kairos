export default function Loading() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="h-6 w-56 rounded-full bg-neutral-200" />
      <div className="h-96 rounded-3xl bg-neutral-100" />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="h-64 rounded-3xl bg-neutral-100" />
        <div className="h-64 rounded-3xl bg-neutral-100" />
      </div>
    </div>
  );
}