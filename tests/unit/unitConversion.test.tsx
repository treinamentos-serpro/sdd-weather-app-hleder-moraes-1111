import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../../src/types/weather';

const city: City = {
  id: 1,
  name: 'Curitiba',
  latitude: -25.43,
  longitude: -49.27,
  country: 'Brasil',
  countryCode: 'BR',
  admin1: 'Paraná',
};

const current: CurrentWeatherData = {
  time: '2026-11-11T15:00',
  temperature: 0,
  apparentTemperature: 0,
  weatherCode: 0,
  isDay: true,
  humidity: 78,
  windSpeed: 12,
  precipitation: 0,
  pressure: 1014,
};

// Replica o estado de unidade que o App mantém, já que UnitToggle e CurrentWeather são irmãos.
function Harness() {
  const [unit, setUnit] = useState<Unit>('celsius');
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={city} current={current} unit={unit} />
    </>
  );
}

describe('conversão de unidade', () => {
  it('exibe 0 °C inicialmente e 32 °F ao selecionar °F', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByText('0 °C', { exact: true })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('32 °F', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('0 °C', { exact: true })).not.toBeInTheDocument();
  });
});
