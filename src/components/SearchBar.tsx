import { type FormEvent, useId, useState } from 'react';
import { ptBR } from '../text/pt-BR';

export interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [value, setValue] = useState('');
  const inputId = useId();
  const term = value.trim();
  const canSubmit = !disabled && term.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSearch(term);
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-glass backdrop-blur-md sm:w-80"
    >
      <label htmlFor={inputId} className="sr-only">
        {ptBR.search.label}
      </label>
      <input
        id={inputId}
        type="search"
        name="city"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={ptBR.search.placeholder}
        readOnly={disabled}
        aria-disabled={disabled}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent px-3 py-2 font-sans text-base text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-xl bg-accent-500 px-4 py-2 font-sans text-sm font-semibold text-night-900 transition-colors enabled:hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ptBR.search.submit}
      </button>
    </form>
  );
}
