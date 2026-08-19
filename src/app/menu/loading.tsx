export default function MenuLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 sm:px-8 py-8">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="h-3 w-32 rounded bg-line" />
          <div className="h-11 w-80 rounded bg-line" />
        </div>
        <div className="h-12 w-24 rounded-full bg-line" />
      </div>
      <div className="mb-8 flex gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 w-24 rounded-full bg-line" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3.5 rounded-2xl bg-canteen-light p-4">
            <div className="h-[180px] w-full rounded-xl bg-line" />
            <div className="h-5 w-2/3 rounded bg-line" />
            <div className="h-4 w-full rounded bg-line" />
            <div className="h-12 w-full rounded-full bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
