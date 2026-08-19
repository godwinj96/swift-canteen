export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 h-10 w-56 rounded bg-line" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-canteen-light" />
        ))}
      </div>
    </div>
  );
}
