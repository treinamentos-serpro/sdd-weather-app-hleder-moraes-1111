interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        🌍
      </span>
      <p className="text-lg text-white/80">{title}</p>
      <p className="text-sm text-white/50">{hint}</p>
    </div>
  );
}
