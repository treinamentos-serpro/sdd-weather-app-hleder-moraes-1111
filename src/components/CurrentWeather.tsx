import { formatTime } from '../lib/dateFormat';
import { formatTemperature, roundHalfUp } from '../lib/temperature';
import { describeWeatherCode } from '../lib/weatherCode';
import { ptBR } from '../text/pt-BR';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

interface MetricProps {
  label: string;
  value: string;
}

function formatMetric(value: number | null, suffix: string): string {
  return value === null || !Number.isFinite(value) ? '—' : `${roundHalfUp(value)}${suffix}`;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <dt className="text-xs uppercase tracking-wide text-white/60">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-white">{value}</dd>
    </div>
  );
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const condition = describeWeatherCode(current.weatherCode);
  const label = ptBR.weather[condition.labelKey];
  const place = [city.name, city.admin1, city.country].filter(Boolean).join(', ');

  return (
    <section
      aria-labelledby="current-weather-title"
      className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur-md sm:p-8"
    >
      <h2 id="current-weather-title" className="text-xl font-medium text-white/80">
        {place}
      </h2>

      <div className="mt-4 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-6xl font-bold text-white sm:text-8xl">
            {formatTemperature(current.temperature, unit)}
          </p>
          <p className="mt-2 text-lg text-white/90">{label}</p>
          <p className="text-sm text-white/60">
            {ptBR.current.feelsLike(formatTemperature(current.apparentTemperature, unit))}
          </p>
        </div>
        <WeatherIcon group={condition.group} isDay={current.isDay} />
      </div>

      <p className="mt-4 text-sm text-white/60">
        {ptBR.current.updatedAt(formatTime(current.time))}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label={ptBR.current.metrics.humidity} value={formatMetric(current.humidity, '%')} />
        <Metric
          label={ptBR.current.metrics.wind}
          value={formatMetric(current.windSpeed, ' km/h')}
        />
        <Metric
          label={ptBR.current.metrics.precipitation}
          value={formatMetric(current.precipitation, ' mm')}
        />
        <Metric
          label={ptBR.current.metrics.pressure}
          value={formatMetric(current.pressure, ' hPa')}
        />
      </dl>
    </section>
  );
}
