export function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-blush-border bg-white p-8 shadow-sm">
      <span className="inline-flex items-center rounded-full bg-mist px-3 py-1 text-xs font-medium text-accent">
        Đang phát triển
      </span>
      <h1 className="font-display mt-3 text-2xl font-bold text-zinc-900">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}
