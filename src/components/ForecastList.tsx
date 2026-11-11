import { getDayLabel } from '../lib/format';
import { ptBR } from '../text/pt-BR';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

const FORECAST_DAYS = 5;

interface ForecastListProps {
  days: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ days, unit }: ForecastListProps) {
  // Rótulo calculado pelo índice original (0 = hoje), antes de omitir dias sem dados.
  const visible = days
    .slice(0, FORECAST_DAYS)
    .map((day, index) => ({ day, index, label: getDayLabel(day.date, index) }))
    .filter(({ day }) => day.temperatureMax !== null || day.temperatureMin !== null);

  return (
    <section aria-labelledby="forecast-title" className="flex flex-col gap-4">
      <h2 id="forecast-title" className="text-xl font-medium text-white/80">
        {ptBR.forecast.title}
      </h2>
      {visible.length < FORECAST_DAYS && (
        <p className="text-sm text-white/60">
          {ptBR.forecast.incomplete(visible.length, FORECAST_DAYS)}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map(({ day, index, label }) => (
          <li key={index}>
            <ForecastCard day={day} label={label} unit={unit} />
          </li>
        ))}
      </ul>
    </section>
  );
}
