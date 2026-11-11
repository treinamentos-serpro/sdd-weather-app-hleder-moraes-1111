import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import { ptBR } from './text/pt-BR';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, error, canRetry, query, search, retry } = useWeather();
  const resultRef = useRef<HTMLDivElement>(null);

  // Após uma busca bem-sucedida, o foco vai para o resultado; sem isso, o botão desabilitado perde o foco.
  useEffect(() => {
    if (status === 'success' && data) resultRef.current?.focus();
  }, [status, data]);

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl text-sun">
              ☀️
            </span>
            <h1 className="text-lg font-bold">{ptBR.app.brand}</h1>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <SearchBar onSearch={search} disabled={status === 'loading'} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>

      <main aria-busy={status === 'loading'} className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {status === 'idle' && <EmptyState title={ptBR.app.idle.title} hint={ptBR.app.idle.hint} />}

        {status === 'loading' && <LoadingState />}

        {status === 'empty' && (
          <EmptyState title={ptBR.app.empty.title(query)} hint={ptBR.app.empty.hint} />
        )}

        {status === 'error' && (
          <ErrorState message={error ?? ''} onRetry={canRetry ? retry : undefined} />
        )}

        {status === 'success' && data && (
          <div ref={resultRef} tabIndex={-1} className="space-y-8 focus:outline-none">
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList days={data.daily} unit={unit} />
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-white/60">
        {ptBR.app.footer}{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="text-accent-400 hover:underline"
        >
          Open-Meteo
        </a>
      </footer>
    </div>
  );
}
