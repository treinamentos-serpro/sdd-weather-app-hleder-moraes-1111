import { ptBR } from '../../text/pt-BR';

interface ErrorStateProps {
  message: string;
  /** Ausente quando o erro não admite nova tentativa (ex.: `no_data`). */
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        ⚠️
      </span>
      <p className="text-white/80">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-night-900 transition hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
        >
          {ptBR.states.retry}
        </button>
      )}
    </div>
  );
}
