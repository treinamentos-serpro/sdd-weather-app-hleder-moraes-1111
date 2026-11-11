import { formatDate } from '../lib/dateFormat';
import { formatTemperature } from '../lib/temperature';
import { describeWeatherCode } from '../lib/weatherCode';
import { ptBR } from '../text/pt-BR';
import type { ForecastDay, Unit } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface ForecastCardProps {
  day: ForecastDay;
  label: string;
  unit: Unit;
}

interface TemperatureProps {
  label: string;
  value: string;
}

function Temperature({ label, value }: TemperatureProps) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/60">{label}</dt>
      <dd className="text-lg font-semibold text-white">{value}</dd>
    </div>
  );
}

export default function ForecastCard({ day, label, unit }: ForecastCardProps) {
  const condition = describeWeatherCode(day.weatherCode);
  const conditionLabel = ptBR.weather[condition.labelKey];

  return (
    <article
      aria-label={`${label}, ${formatDate(day.date)}`}
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-glass backdrop-blur-md"
    >
      <header>
        <p className="font-medium text-white">{label}</p>
        <p className="text-xs text-white/60">{formatDate(day.date)}</p>
      </header>
      <WeatherIcon group={condition.group} isDay className="h-12 w-12 text-sun" />
      <p className="text-sm text-white/80">{conditionLabel}</p>
      <dl className="grid w-full grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-2">
        <Temperature
          label={ptBR.forecast.max}
          value={formatTemperature(day.temperatureMax, unit)}
        />
        <Temperature
          label={ptBR.forecast.min}
          value={formatTemperature(day.temperatureMin, unit)}
        />
      </dl>
    </article>
  );
}
