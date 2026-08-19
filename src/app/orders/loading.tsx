export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 sm:px-8 py-12">
      <div className="mb-8 h-10 w-56 rounded bg-line" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-canteen-light" />
        ))}
      </div>
    </div>
  );
}
