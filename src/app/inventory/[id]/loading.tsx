export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 animate-pulse">
      <div className="h-4 w-48 rounded bg-muted mb-8" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-[16/10] w-full rounded-xl bg-muted" />
          <div className="mt-3 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-24 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-5 w-24 rounded-full bg-muted" />
          <div className="h-10 w-3/4 rounded bg-muted" />
          <div className="h-8 w-40 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted" />
            ))}
          </div>
          <div className="h-12 w-full rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
