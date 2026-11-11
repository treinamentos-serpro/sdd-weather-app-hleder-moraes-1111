import { expect, test } from '@playwright/test';

const GEOCODING_ROUTE = '**/geocoding-api.open-meteo.com/v1/search*';
const FORECAST_ROUTE = '**/api.open-meteo.com/v1/forecast*';

const geocodingBody = {
  results: [
    {
      id: 3464975,
      name: 'Curitiba',
      latitude: -25.42778,
      longitude: -49.27306,
      country: 'Brasil',
      country_code: 'BR',
      admin1: 'Paraná',
    },
  ],
};

const forecastBody = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-11-11T15:00',
    temperature_2m: 0,
    apparent_temperature: 0,
    relative_humidity_2m: 78,
    wind_speed_10m: 12,
    precipitation: 0,
    pressure_msl: 1014,
    weather_code: 0,
    is_day: 1,
  },
  daily: {
    time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
    weather_code: [0, 1, 2, 3, 61],
    temperature_2m_max: [20, 21, 19, 18, 17],
    temperature_2m_min: [10, 11, 9, 8, 7],
  },
};

test('busca cidade, exibe clima e converte para °F', async ({ page }) => {
  await page.route(GEOCODING_ROUTE, (route) => route.fulfill({ json: geocodingBody }));
  await page.route(FORECAST_ROUTE, (route) => route.fulfill({ json: forecastBody }));

  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Curitiba, Paraná' })).toBeVisible();
  await expect(page.locator('main [tabindex="-1"]')).toBeFocused();

  const forecast = page.getByRole('region', { name: 'Previsão' });
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);

  await expect(page.getByText('0 °C', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '°F' }).click();

  await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('32 °F', { exact: true })).toBeVisible();
});

test('exibe mensagem de vazio quando o geocoding não retorna cidades', async ({ page }) => {
  await page.route(GEOCODING_ROUTE, (route) => route.fulfill({ json: {} }));

  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Xyzabc');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByText('Nenhuma cidade encontrada para "Xyzabc".')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão' })).toHaveCount(0);
});

test.describe('viewport mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('busca cidade e exibe o clima sem overflow horizontal', async ({ page }) => {
    await page.route(GEOCODING_ROUTE, (route) => route.fulfill({ json: geocodingBody }));
    await page.route(FORECAST_ROUTE, (route) => route.fulfill({ json: forecastBody }));

    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Curitiba');
    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.getByRole('heading', { name: 'Curitiba, Paraná' })).toBeVisible();
    await expect(page.getByText('0 °C', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Previsão' })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('bordas de entrada e resposta incompleta', () => {
  test('busca vazia mantém o botão desabilitado e não chama o geocoding (E-01)', async ({
    page,
  }) => {
    let geocodingCalls = 0;
    await page.route(GEOCODING_ROUTE, (route) => {
      geocodingCalls += 1;
      return route.fulfill({ json: geocodingBody });
    });

    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await page.getByRole('searchbox', { name: 'Buscar cidade' }).press('Enter');

    await expect(page.getByText('Pesquise uma cidade para ver o clima.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(geocodingCalls).toBe(0);
  });

  test('só espaços não dispara a busca nem exibe erro (E-01)', async ({ page }) => {
    let geocodingCalls = 0;
    await page.route(GEOCODING_ROUTE, (route) => {
      geocodingCalls += 1;
      return route.fulfill({ json: geocodingBody });
    });

    await page.goto('/');

    const input = page.getByRole('searchbox', { name: 'Buscar cidade' });
    await input.fill('   ');
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await input.press('Enter');

    await expect(page.getByText('Pesquise uma cidade para ver o clima.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(geocodingCalls).toBe(0);
  });

  test('caracteres especiais são enviados codificados e exibidos como texto (E-05)', async ({
    page,
  }) => {
    const term = '<b>São & Co?</b> @#$%';
    let requestedName: string | null = null;
    await page.route(GEOCODING_ROUTE, (route) => {
      requestedName = new URL(route.request().url()).searchParams.get('name');
      return route.fulfill({ json: {} });
    });

    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill(term);
    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.getByText(`Nenhuma cidade encontrada para "${term}".`)).toBeVisible();
    expect(requestedName).toBe(term);
    await expect(page.locator('b')).toHaveCount(0);
  });

  test('geocoding sem resultados não solicita a previsão (E-03)', async ({ page }) => {
    let forecastCalls = 0;
    await page.route(GEOCODING_ROUTE, (route) => route.fulfill({ json: {} }));
    await page.route(FORECAST_ROUTE, (route) => {
      forecastCalls += 1;
      return route.fulfill({ json: forecastBody });
    });

    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Xyzabc');
    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.getByText('Nenhuma cidade encontrada para "Xyzabc".')).toBeVisible();
    expect(forecastCalls).toBe(0);
  });

  test('avisa quando a API retorna menos de 5 dias de previsão (E-07)', async ({ page }) => {
    const partialDaily = {
      time: forecastBody.daily.time.slice(0, 3),
      weather_code: forecastBody.daily.weather_code.slice(0, 3),
      temperature_2m_max: forecastBody.daily.temperature_2m_max.slice(0, 3),
      temperature_2m_min: forecastBody.daily.temperature_2m_min.slice(0, 3),
    };
    await page.route(GEOCODING_ROUTE, (route) => route.fulfill({ json: geocodingBody }));
    await page.route(FORECAST_ROUTE, (route) =>
      route.fulfill({ json: { ...forecastBody, daily: partialDaily } }),
    );

    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill('Curitiba');
    await page.getByRole('button', { name: 'Buscar' }).click();

    const forecast = page.getByRole('region', { name: 'Previsão' });
    await expect(forecast).toBeVisible();
    await expect(forecast.getByRole('listitem')).toHaveCount(3);
    await expect(page.getByText('Previsão incompleta: 3 de 5 dias disponíveis')).toBeVisible();
  });
});
