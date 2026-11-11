import type { ConditionGroup } from '../types/weather';

interface WeatherIconProps {
  group: ConditionGroup;
  isDay: boolean;
  className?: string;
}

const SUN_RAYS =
  'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41';
const CLOUD = 'M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.5a3.75 3.75 0 0 1-.25 7.5H7z';
const MOON = 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z';
const RAIN = 'M8 21l1-2M12 21l1-2M16 21l1-2';
const SNOW = 'M8 20h.01M12 20h.01M16 20h.01M10 22h.01M14 22h.01';
const BOLT = 'M13 17l-2 4 1-5-3 .5 4-6-.5 3z';
const FOG = 'M3 9h18M5 13h14M3 17h18';

function paths(group: ConditionGroup, isDay: boolean): string[] {
  switch (group) {
    case 'sun':
      return isDay ? [SUN_RAYS, 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z'] : [MOON];
    case 'partly-cloudy':
      return isDay ? ['M5 8a3 3 0 1 1 4.2-2.7', CLOUD] : [MOON, CLOUD];
    case 'cloud':
      return [CLOUD];
    case 'fog':
      return [FOG];
    case 'rain':
      return [CLOUD, RAIN];
    case 'snow':
      return [CLOUD, SNOW];
    case 'thunderstorm':
      return [CLOUD, BOLT];
    case 'unknown':
      return [CLOUD];
  }
}

// Decorativo: a condição já é lida em texto ao lado, então o ícone fica oculto para leitores de tela.
export default function WeatherIcon({
  group,
  isDay,
  className = 'h-24 w-24 text-sun',
}: WeatherIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths(group, isDay).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
