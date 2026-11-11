# Backlog de Tarefas — Aplicação de Previsão do Tempo

- **Status:** Rascunho para execução (v0.3: dependências explícitas e ordem por fase de implementação)
- **Data:** 2026-11-11
- **Fonte:** [weather-app-plan.md](../plans/weather-app-plan.md) (v0.1), que deriva de [weather-app-spec.md](../specs/weather-app-spec.md) (v0.5)

> Cada tarefa é uma unidade testável. IDs no formato `T-NN`. Tipos: **Infra**,
> **Data** (contratos, lógica pura, serviços e hooks), **UI** (componentes e
> textos) e **Test** (unitário, E2E, spike e fechamento). As entregas seguem a
> ordem de implementação: tipos → funções puras → serviços → hook → componentes →
> integração → testes → hardening → E2E e fechamento. As dependências de cada
> tarefa estão no campo **Dependências**, e a ordem de execução está no fim do
> arquivo. Os IDs continuam os da v0.2, então não aparecem em ordem numérica.

> **Mudança em relação à v0.1:** 12 tarefas grandes foram quebradas em 26
> subtarefas, e os IDs foram renumerados sequencialmente (54 → 68). A tabela de
> correspondência está ao final do arquivo.

---

## Decisões e pendências que afetam as tarefas

Estes pontos foram encontrados ao cruzar o plano com a spec e com o estado atual
do repositório. Eles precisam ser confirmados ou corrigidos no plano antes de
começar as tarefas marcadas.

| ID | Pendência | Decisão adotada nas tarefas | Tarefas afetadas |
| --- | --- | --- | --- |
| D-01 | **Conflito de camadas:** a seção 1.2 proíbe `lib/` de importar `text/`, mas a seção 4.4 coloca os rótulos em pt-BR dentro de `lib/weatherCode.ts`. | `lib/weatherCode.ts` devolve o `group` e uma chave tipada de rótulo (`WeatherLabelKey`, em `types/`). Os textos ficam em `text/pt-BR.ts`, e a UI resolve a chave. Atualizar 4.2 e 4.4 do plano. | T-16, T-17, T-18, T-35, T-47, T-48 |
| D-02 | **Config de testes:** a seção 3 prevê `vitest.config.ts`, mas o [vite.config.ts](../vite.config.ts) já tem o bloco `test`. | Manter a configuração no `vite.config.ts` existente. Atualizar a seção 3 do plano. | T-03 |
| D-03 | **Navegadores E2E:** [playwright.config.ts](../playwright.config.ts) tem os projetos `chromium` e `mobile`. O plano (9.3) e a RNF-11 exigem `chromium`, `firefox` e `webkit`. | Substituir os projetos pelos três navegadores. Os viewports ficam nos testes. | T-07 |
| D-04 | **Dependências ausentes:** `vite-plugin-pwa` e `@axe-core/playwright` não estão no `package.json`. | Instalar com `pnpm add` / `pnpm add -D` nas tarefas T-05 e T-07. | T-05, T-07 |
| D-05 | **Script `lint`:** o `package.json` usa `biome lint ./src ./tests`, mas o plano (9.5) prevê `biome check .`. | Alinhar com o plano em T-01. | T-01 |
| D-06 | **OQ-08 (fuso):** a proposta é `timezone=auto`, ainda não confirmada pelo produto. | Assumir a proposta. O spike T-21 confirma o formato. | T-21, T-24, T-29 |
| D-07 | **Spike de endpoints (6.4):** depende de rede externa. | Se a Open-Meteo não estiver acessível, registrar a pendência em T-21 e usar fixtures derivadas da documentação. | T-21 |
| D-08 | **Mitigação R-01 × RN-06:** o plano segue RN-06 (sem cache). | Nenhuma tarefa cria cache de dados meteorológicos. | T-26, T-32 |

---

## Entrega 0 — Fundação do projeto

### T-01 — Validar base do projeto e scripts
- **Tipo:** Infra
- **Descrição:** confirmar que `package.json`, `tsconfig*.json`, `index.html`,
  `biome.json` e os scripts estão prontos para desenvolvimento. Alinhar o script
  `lint` ao plano (D-05).
- **Critérios de aceite:**
  - [ ] `pnpm install` conclui sem erro.
  - [ ] Script `lint` roda `biome check .`, conforme 9.5 do plano.
  - [ ] Script `test:e2e:live` existe e aponta para `playwright test tests/e2e/live`.
- **Dependências:** nenhuma
- **Arquivos prováveis:** `package.json`, `tsconfig.json`, `tsconfig.app.json`, `index.html`
- **Rastreia:** RNF-06, O-4

### T-02 — Criar esqueleto de `src/`
- **Tipo:** Infra
- **Descrição:** criar a estrutura de pastas da seção 3 do plano, com um `App`
  mínimo renderizado a partir de `main.tsx`.
- **Critérios de aceite:**
  - [ ] `src/main.tsx`, `src/App.tsx` e `src/index.css` existem.
  - [ ] Pastas `src/components/`, `src/hooks/`, `src/services/`, `src/lib/`, `src/text/` e `src/types/` existem.
  - [ ] `pnpm build` passa com o esqueleto.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/main.tsx`, `src/App.tsx`, `src/index.css`
- **Rastreia:** RNF-10

### T-03 — Configurar Vitest e Testing Library
- **Tipo:** Infra
- **Descrição:** configurar o setup de Testing Library no bloco `test` do
  `vite.config.ts` existente (D-02) e criar um teste de fumaça.
- **Critérios de aceite:**
  - [ ] `tests/setup.ts` importa `@testing-library/jest-dom`.
  - [ ] `vite.config.ts` aponta para `tests/setup.ts` e `tests/unit/**`.
  - [ ] `pnpm test` passa, com o teste de fumaça em `tests/unit/`.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/setup.ts`, `tests/unit/smoke.test.tsx`, `vite.config.ts`
- **Rastreia:** RNF-06

### T-04 — Configurar tema Tailwind (glassmorphism dark)
- **Tipo:** Infra
- **Descrição:** validar os tokens `night-*`, `accent-*`, `sun` e a fonte Inter
  em `tailwind.config.js` e aplicá-los em `src/index.css`. Conferir o contraste
  dos tokens antes de usá-los nos componentes (R-05).
- **Critérios de aceite:**
  - [ ] Texto principal sobre o fundo atinge contraste ≥ 4,5:1, e elementos gráficos ≥ 3:1.
  - [ ] Os tokens são usados via classes Tailwind, sem cores soltas nos componentes.
  - [ ] Existe classe de suporte com fundo sólido para navegadores sem `backdrop-filter` (E-20).
- **Dependências:** T-02
- **Arquivos prováveis:** `tailwind.config.js`, `src/index.css`
- **Rastreia:** RNF-03, R-05, R-09, E-20

### T-05 — Configurar PWA: plugin, manifest e precache
- **Tipo:** Infra
- **Descrição:** instalar `vite-plugin-pwa` (D-04) e configurar o manifest e o
  precache apenas da shell. Não cachear respostas da API.
- **Critérios de aceite:**
  - [ ] `pnpm add -D vite-plugin-pwa` registrado no `package.json`.
  - [ ] Manifest tem nome, `display: standalone` e referencia ícones 192, 512 e maskable.
  - [ ] Workbox faz precache somente da shell; não há `runtimeCaching` para `api.open-meteo.com` ou `geocoding-api.open-meteo.com`.
  - [ ] `pnpm build` gera `manifest.webmanifest` e o service worker.
- **Dependências:** T-02
- **Arquivos prováveis:** `vite.config.ts`, `package.json`
- **Rastreia:** RNF-08, RF-08 (instalabilidade), RN-06

### T-06 — Ícones do PWA
- **Tipo:** Infra
- **Descrição:** adicionar os arquivos de ícone que o manifest referencia.
- **Critérios de aceite:**
  - [ ] Existem ícones de 192, 512 e maskable em `public/icons/`.
  - [ ] Os caminhos do manifest gerado apontam para esses arquivos.
- **Dependências:** T-05
- **Arquivos prováveis:** `public/icons/*`
- **Rastreia:** RNF-08, RF-08 (instalabilidade)

### T-07 — Configurar Playwright para Chromium, Firefox, WebKit e axe
- **Tipo:** Infra
- **Descrição:** trocar os projetos de navegador (D-03), instalar
  `@axe-core/playwright` (D-04) e manter o `webServer` apontando para o dev server.
- **Critérios de aceite:**
  - [ ] Projetos `chromium`, `firefox` e `webkit` definidos em `playwright.config.ts`.
  - [ ] `pnpm add -D @axe-core/playwright` registrado.
- **Dependências:** T-02
- **Arquivos prováveis:** `playwright.config.ts`, `package.json`
- **Rastreia:** RNF-11, RNF-03, R-10

### T-08 — Teste de fumaça E2E
- **Tipo:** Test
- **Descrição:** criar um teste mínimo que abre a página, para validar que o
  harness do Playwright funciona nos três navegadores.
- **Critérios de aceite:**
  - [ ] `pnpm test:e2e --list` lista o teste sem erro.
  - [ ] O teste abre a página e encontra o `App` renderizado.
- **Dependências:** T-07
- **Arquivos prováveis:** `tests/e2e/smoke.spec.ts`
- **Rastreia:** RNF-11, RNF-06

---

## Entrega 1 — Domínio puro (contratos e funções sem efeitos)

### T-09 — Definir tipos de domínio
- **Tipo:** Data
- **Descrição:** criar os contratos da seção 4 do plano: `City`, `CurrentWeather`,
  `ForecastDay`, `WeatherData`, `ConditionGroup`, `WeatherLabelKey` (D-01),
  `WeatherErrorKind`, `WeatherError`, `AsyncState<T>` e `Unit`.
- **Critérios de aceite:**
  - [ ] Tipos idênticos às seções 4.1 a 4.6 do plano.
  - [ ] `pnpm build` (`tsc -b`) passa em modo `strict`.
  - [ ] Nenhum tipo importa de `components/`, `hooks/`, `services/` ou `text/`.
- **Dependências:** T-02
- **Arquivos prováveis:** `src/types/weather.ts`
- **Rastreia:** RNF-09, RNF-10

### T-10 — Conversão e arredondamento de temperatura
- **Tipo:** Data
- **Descrição:** implementar em `lib/temperature.ts` a conversão C ↔ F, o
  arredondamento RN-05 (`Math.floor(x + 0.5)`) e `formatTemperature(celsius, unit)`
  com vírgula decimal pt-BR e `—` para `null`.
- **Critérios de aceite:**
  - [ ] `formatTemperature(21.4, 'fahrenheit')` retorna `71 °F`.
  - [ ] Empate: `2,5 → 3` e `−2,5 → −2`.
  - [ ] `null` retorna `—`.
  - [ ] Função pura: não importa React, `services/`, `text/` nem tem efeitos.
- **Dependências:** T-09
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Rastreia:** RN-02, RN-05, AC-05.1, AC-05.2, AC-05.4, E-14, E-21

### T-12 — Formatação de datas e horas
- **Tipo:** Data
- **Descrição:** implementar em `lib/dateFormat.ts` a formatação de `HH:mm` e
  `dd/mm/aaaa` a partir da string local da API (`"2026-11-11T15:00"`), sem usar
  `Date` do navegador.
- **Critérios de aceite:**
  - [ ] Não cria `Date` a partir da string local (evita deslocamento de fuso, R-11).
- **Dependências:** T-09
- **Arquivos prováveis:** `src/lib/dateFormat.ts`
- **Rastreia:** RN-08, R-11, AC-03.1

### T-14 — Nome de exibição da cidade
- **Tipo:** Data
- **Descrição:** implementar em `lib/cityLabel.ts` a função pura que monta
  `[name, admin1, country]` sem `null` ou vazios, unidos por `", "`. Ex.: `Curitiba, Paraná, Brasil`.
- **Critérios de aceite:**
  - [ ] `admin1: null` não gera vírgula sobrando.
  - [ ] Ordem fixa: nome, estado, país.
- **Dependências:** T-09
- **Arquivos prováveis:** `src/lib/cityLabel.ts`
- **Rastreia:** AC-01.4, AC-02.2, R-03

### T-16 — Tabela WMO: código → grupo e chave de rótulo
- **Tipo:** Data
- **Descrição:** implementar em `lib/weatherCode.ts` a tabela completa de
  `weather_code` (seção 4.4) com `group` e `WeatherLabelKey` (D-01). Código `null`
  ou fora da tabela retorna `unknown`.
- **Critérios de aceite:**
  - [ ] Todas as linhas da tabela 4.4 estão cobertas (AC-10.3).
  - [ ] `999` e `null` retornam `group: 'unknown'` (AC-03.5, AC-10.2).
  - [ ] A tabela é um `Record` congelado (`Object.freeze`).
  - [ ] Função pura: não importa `text/`.
- **Dependências:** T-09
- **Arquivos prováveis:** `src/lib/weatherCode.ts`
- **Rastreia:** RF-10, AC-10.1, AC-10.2, AC-10.3, AC-03.5, D-01

### T-17 — Textos de interface em pt-BR
- **Tipo:** UI
- **Descrição:** centralizar em `text/pt-BR.ts` todos os textos da interface,
  incluindo os rótulos de condição indexados por `WeatherLabelKey` (D-01), as
  mensagens de erro da matriz 8.2 e os textos de vazio e instrução inicial.
- **Critérios de aceite:**
  - [ ] Rótulos da tabela 4.4 em pt-BR (ex.: `Chuva leve`, `Céu limpo`).
  - [ ] Mensagens de `WeatherErrorKind` presentes (8.2).
  - [ ] Texto da instrução inicial `Pesquise uma cidade para ver o clima.` e de vazio `Nenhuma cidade encontrada para "{termo}".`.
  - [ ] Nenhum texto de interface está fora deste módulo.
- **Dependências:** T-16
- **Arquivos prováveis:** `src/text/pt-BR.ts`
- **Rastreia:** RN-04, RNF-07, AC-07.8, AC-07.3

---

## Entrega 2 — Dados (Open-Meteo, mappers, HTTP e serviços)

### T-19 — Fixtures de geocoding
- **Tipo:** Test
- **Descrição:** criar payloads JSON em `tests/fixtures/` para a busca de cidades:
  resposta válida (Curitiba), resposta sem `results` e `latitude` como string.
- **Critérios de aceite:**
  - [ ] Cada cenário tem um arquivo com nome descritivo.
  - [ ] As fixtures são usadas apenas por testes.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/fixtures/geocoding-*.json`
- **Rastreia:** plano 9.3, RNF-09

### T-20 — Fixtures de forecast
- **Tipo:** Test
- **Descrição:** criar payloads JSON em `tests/fixtures/` para a previsão: resposta
  válida, 3 dias, 7 dias, `null` no meio, string no lugar de número, sem `current`,
  sem `daily` e virada de dia.
- **Critérios de aceite:**
  - [ ] Cada cenário tem um arquivo com nome descritivo.
  - [ ] As fixtures são usadas apenas por testes.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/fixtures/forecast-*.json`
- **Rastreia:** plano 9.3, RNF-09

### T-21 — Captura de respostas reais da Open-Meteo
- **Tipo:** Test
- **Descrição:** chamar a Open-Meteo com `curl` (ou script) e salvar respostas reais
  em `tests/fixtures/`. Confirmar os itens da seção 6.4: `timezone`, `language=pt`,
  `admin1`, `results` omitido sem resultado, HTTP 400 de coordenadas e `is_day` como inteiro.
- **Critérios de aceite:**
  - [ ] `language=pt` retorna `admin1` e `country` em português.
  - [ ] Busca sem resultado omite `results` (HTTP 200).
  - [ ] Coordenadas fora de faixa retornam HTTP 400 com `{"reason", "error": true}`.
  - [ ] `current.time` vem no horário local com `timezone=auto`; `is_day` é `1`/`0`.
  - [ ] Resultado registrado em comentário no próprio arquivo de fixture ou no PR. Se houver falha de rede, registrar a pendência (D-07).
- **Dependências:** T-19, T-20
- **Arquivos prováveis:** `tests/fixtures/*.json`
- **Rastreia:** A-12, AC-01.4, AC-02.2, AC-07.4, OQ-08 (D-06)

### T-23 — Mapper de geocoding
- **Tipo:** Data
- **Descrição:** implementar `parseGeocodingResponse` em
  `services/openMeteoMappers.ts`. Transforma `results` em `City[]`, descarta itens
  sem `latitude`/`longitude` numéricos válidos e mantém a ordem da API (OQ-07).
- **Critérios de aceite:**
  - [ ] Ausência de `results` retorna `[]`.
  - [ ] Item com `latitude` string é descartado (E-28).
  - [ ] Tipos errados por campo não derrubam o payload inteiro (E-27).
  - [ ] Payload que não é objeto lança `WeatherError('invalid_response')`.
- **Dependências:** T-09
- **Arquivos prováveis:** `src/services/openMeteoMappers.ts`
- **Rastreia:** AC-01.5, E-27, E-28, RNF-09, OQ-07

### T-24 — Mapper de forecast
- **Tipo:** Data
- **Descrição:** implementar `parseForecastResponse` no mesmo módulo. Monta
  `WeatherData`, valida tipos por campo, converte `is_day` para `boolean`, limita a
  5 dias e omite dias sem máxima e mínima (plano 4.3).
- **Critérios de aceite:**
  - [ ] Sem `current` e sem `daily` lança `WeatherError('no_data')` (AC-07.4).
  - [ ] Campo com tipo errado vira `null`, sem derrubar a tela (E-21, E-27).
  - [ ] Dia com máxima e mínima `null` é omitido; dia com só uma é mantido com `null` (AC-04.4, E-26).
  - [ ] `daily` tem no máximo 5 itens, em ordem crescente de data (AC-04.1).
  - [ ] `is_day` `1`/`0` vira `boolean`.
- **Dependências:** T-09, T-21 (D-06)
- **Arquivos prováveis:** `src/services/openMeteoMappers.ts`
- **Rastreia:** RF-03, RF-04, AC-04.1, AC-04.4, AC-07.4, E-21, E-26, E-27

### T-26 — Cliente HTTP com timeout e mapeamento de erros
- **Tipo:** Data
- **Descrição:** implementar `fetchJson` em `services/http.ts`. Usa `AbortController`
  com timeout de 10 s e um `signal` externo. Mapeia falhas para `WeatherErrorKind`.
  O status HTTP 400 deve chegar ao serviço de forecast, que decide `no_data` (6.3).
- **Critérios de aceite:**
  - [ ] Timeout de 10 s vira `timeout`.
  - [ ] Abort externo não vira erro: a promise é descartada (E-12, E-13).
  - [ ] HTTP 429 → `rate_limit`; 5xx → `server`; falha de rede → `network`; JSON inválido → `invalid_response`.
  - [ ] Sem cache e sem retry automático (RN-06, AC-07.2).
  - [ ] Não usa `AbortSignal.timeout` (RNF-11).
- **Dependências:** T-09
- **Arquivos prováveis:** `src/services/http.ts`
- **Rastreia:** AC-01.8, AC-07.2, AC-07.5, AC-07.7, E-08, E-09, E-10, E-11, E-12, RN-06, RNF-04

### T-28 — Serviço de geocoding
- **Tipo:** Data
- **Descrição:** implementar `searchCities(term, signal)` em `services/geocodingService.ts`.
  Monta a URL com `encodeURIComponent`, `count=10`, `language=pt`, `format=json`
  (plano 6.1) e passa a resposta pelo mapper.
- **Critérios de aceite:**
  - [ ] `São Paulo` vira `S%C3%A3o%20Paulo` na URL (AC-01.3).
  - [ ] Não envia país nem filtro regional (RN-07).
  - [ ] Repassa o `signal` ao cliente HTTP.
  - [ ] Retorna `City[]` vindo do mapper.
- **Dependências:** T-21, T-23, T-26
- **Arquivos prováveis:** `src/services/geocodingService.ts`
- **Rastreia:** RF-01, AC-01.3, AC-01.6, RN-07

### T-29 — Serviço de forecast
- **Tipo:** Data
- **Descrição:** implementar `fetchWeatherData(city, signal)` em
  `services/forecastService.ts`. Faz **uma única** requisição com `current`,
  `daily`, `timezone=auto`, `forecast_days=5` e `temperature_unit=celsius`, conforme
  a seção 6.2 do plano. HTTP 400 vira `no_data`.
- **Critérios de aceite:**
  - [ ] Uma requisição por chamada (RNF-02).
  - [ ] Parâmetros conforme 6.2 do plano.
  - [ ] HTTP 400 → `WeatherError('no_data')` (AC-07.6).
  - [ ] Resposta passa pelo mapper de forecast.
- **Dependências:** T-21, T-24, T-26
- **Arquivos prováveis:** `src/services/forecastService.ts`
- **Rastreia:** RF-03, RF-04, RNF-02, AC-07.6, RN-06

---

## Entrega 3 — Hooks (orquestração de estado assíncrono)

### T-31 — Hook `useCitySearch`
- **Tipo:** Data
- **Descrição:** implementar `hooks/useCitySearch.ts` com debounce de 300 ms
  (`setTimeout` interno), `trim`, validação de 2 caracteres, cancelamento por
  `AbortController` no cleanup e o aviso de limite de 100 caracteres.
- **Critérios de aceite:**
  - [ ] Debounce de 300 ms (AC-01.1).
  - [ ] Termo com menos de 2 caracteres volta a `idle` e não chama a rede (AC-01.2, E-01, E-02).
  - [ ] Nova busca aborta a anterior (E-12, E-29).
  - [ ] Estado `AsyncState<City[]>`; busca sem resultado é `success` com `[]` (AC-07.3).
  - [ ] Aviso de limite de 100 caracteres exposto (AC-01.7).
- **Dependências:** T-28
- **Arquivos prováveis:** `src/hooks/useCitySearch.ts`
- **Rastreia:** RF-01, RF-07, AC-01.1, AC-01.2, AC-01.7, AC-07.3

### T-32 — Hook `useWeather`
- **Tipo:** Data
- **Descrição:** implementar `hooks/useWeather.ts`, que recebe `selectedCity`, chama
  `fetchWeatherData` e expõe `retry()`. `retry()` incrementa um contador usado como
  dependência do efeito.
- **Critérios de aceite:**
  - [ ] `selectedCity = null` → `idle`, sem requisição (AC-07.8).
  - [ ] Trocar a cidade aborta a requisição anterior (E-13).
  - [ ] `retry()` faz exatamente uma requisição com os mesmos parâmetros (AC-07.2).
  - [ ] Sem retry automático e sem cache (RN-06, D-08).
- **Dependências:** T-29
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Rastreia:** RF-03, RF-04, RF-07, AC-02.3, AC-07.2, AC-07.8, E-13

---

## Entrega 4 — Componentes base de apresentação

### T-35 — Componente `WeatherIcon`
- **Tipo:** UI
- **Descrição:** SVG inline por `ConditionGroup`, com nome acessível igual ao rótulo
  da condição (D-01). Sem biblioteca de ícones.
- **Critérios de aceite:**
  - [ ] Um ícone por grupo da seção 4.2 e `sun`/`moon` escolhidos por `isDay`.
  - [ ] `aria-label` igual ao rótulo da condição (AC-03.2).
  - [ ] Um componente por arquivo, `export default`.
- **Dependências:** T-04, T-16
- **Arquivos prováveis:** `src/components/WeatherIcon.tsx`
- **Rastreia:** RF-10, AC-03.2, RNF-10

### T-36 — Componente `StatusMessage`
- **Tipo:** UI
- **Descrição:** renderiza loading, erro e vazio com `role` e `aria` corretos.
- **Critérios de aceite:**
  - [ ] Loading: `Carregando...` em `role="status"` com `aria-busy="true"` (AC-07.1).
  - [ ] Erro: `role="alert"` com a mensagem de `text/pt-BR.ts`.
  - [ ] Recebe props prontas; não importa `services/` nem chama hooks.
- **Dependências:** T-04, T-17
- **Arquivos prováveis:** `src/components/StatusMessage.tsx`
- **Rastreia:** RF-07, AC-07.1, E-19

### T-37 — Componente `AttributionFooter`
- **Tipo:** UI
- **Descrição:** rodapé com `Dados: Open-Meteo` e link para o provedor.
- **Critérios de aceite:**
  - [ ] Texto `Dados: Open-Meteo` com link externo (`rel="noopener"`).
  - [ ] Visível em todas as telas com dados meteorológicos.
- **Dependências:** T-04, T-17
- **Arquivos prováveis:** `src/components/AttributionFooter.tsx`
- **Rastreia:** RF-09, AC-09.1, AC-09.2


---

## Entrega 5 — Busca e seleção de cidade

### T-41 — Componente `CityResults`
- **Tipo:** UI
- **Descrição:** lista selecionável de cidades. Mostra o nome via `cityLabel` e
  responde a Enter e clique.
- **Critérios de aceite:**
  - [ ] Cada opção mostra `Curitiba, Paraná, Brasil` (AC-02.2).
  - [ ] Enter seleciona a opção focada (AC-02.1).
  - [ ] `key` por `City.id`.
- **Dependências:** T-04, T-14
- **Arquivos prováveis:** `src/components/CityResults.tsx`
- **Rastreia:** RF-02, AC-02.1, AC-02.2, R-03

### T-42 — Componente `CitySearch`
- **Tipo:** UI
- **Descrição:** campo de busca com `label` associado, ligado a `useCitySearch`,
  com aviso de 100 caracteres e a lista de resultados ou estados via `StatusMessage`.
  Inclui o botão `Tentar novamente`.
- **Critérios de aceite:**
  - [ ] Campo com `label` visível ou `aria-label` (RNF-03).
  - [ ] Ao passar de 100 caracteres, corta e mostra `Máximo de 100 caracteres` (AC-01.7).
  - [ ] Erro mostra mensagem e `Tentar novamente`, que chama `retry` uma vez (AC-07.2).
  - [ ] Sem resultados mostra `Nenhuma cidade encontrada para "{termo}".` (AC-07.3).
- **Dependências:** T-31, T-36, T-41
- **Arquivos prováveis:** `src/components/CitySearch.tsx`
- **Rastreia:** RF-01, RF-07, AC-01.7, AC-07.2, AC-07.3


---

## Entrega 6 — Clima, previsão e unidade

### T-47 — Componente `CurrentWeather`
- **Tipo:** UI
- **Descrição:** temperatura, sensação térmica, condição com ícone, umidade, vento,
  precipitação, pressão e `Atualizado às HH:mm`. Usa `formatTemperature` na
  renderização (RN-02). Métricas arredondadas conforme RN-05, com unidade (`%`,
  `km/h`, `mm`, `hPa`) e rótulos em `text/pt-BR.ts`.
- **Critérios de aceite:**
  - [ ] Mostra temperatura, sensação, condição e horário (RF-03).
  - [ ] `null` em `apparentTemperature` vira `—` (E-21).
  - [ ] Mostra umidade, vento, precipitação e pressão com unidade; `null` vira `—` (AC-03.6, AC-03.7).
  - [ ] Não mostra UV (AC-03.3).
- **Dependências:** T-10, T-12, T-16, T-17, T-35
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Rastreia:** RF-03, RN-02, RN-03, AC-03.1, AC-03.3, AC-03.5, AC-03.6, AC-03.7, E-21

### T-48 — Componente `ForecastList` e `ForecastDayCard`
- **Tipo:** UI
- **Descrição:** grade de 5 dias com máxima, mínima e condição por dia. Mostra
  `Previsão incompleta: N de 5 dias disponíveis` quando houver menos de 5.
- **Critérios de aceite:**
  - [ ] Cinco cards quando há 5 dias (AC-04.2).
  - [ ] Com 3 dias: `Previsão incompleta: 3 de 5 dias disponíveis` (AC-04.3, E-07).
  - [ ] Campo ausente mostra `—` (E-21).
  - [ ] Cada card mostra data em `dd/mm/aaaa` (RN-08).
- **Dependências:** T-10, T-12, T-16, T-17, T-35
- **Arquivos prováveis:** `src/components/ForecastList.tsx`, `src/components/ForecastDayCard.tsx`
- **Rastreia:** RF-04, AC-04.2, AC-04.3, E-07, E-21

### T-49 — Componente `UnitToggle`
- **Tipo:** UI
- **Descrição:** botão C/F com `aria-pressed` e anúncio em `role="status"`. Não faz
  requisição; só chama o callback.
- **Critérios de aceite:**
  - [ ] `aria-pressed` alterna entre Celsius e Fahrenheit (AC-05.3).
  - [ ] Anúncio `Unidade alterada para Fahrenheit` em `role="status"`.
  - [ ] Clicar não dispara `fetch` (plano 5.3).
- **Dependências:** T-04, T-17
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Rastreia:** RF-05, RF-06, AC-05.3, E-16

### T-50 — Componente `WeatherPanel`
- **Tipo:** UI
- **Descrição:** escolhe o que mostrar a partir de `AsyncState<WeatherData>`:
  loading (esqueleto), erro por `WeatherErrorKind`, `no_data` sem botão e sucesso.
- **Critérios de aceite:**
  - [ ] Loading: `aria-busy="true"` e esqueleto (AC-07.1).
  - [ ] Erro: mensagem por tipo, com `Tentar novamente` exceto em `no_data` (AC-07.6).
  - [ ] Sucesso: `CurrentWeather` e `ForecastList`.
- **Dependências:** T-32, T-36, T-47, T-48
- **Arquivos prováveis:** `src/components/WeatherPanel.tsx`
- **Rastreia:** RF-07, RNF-04, AC-07.1, AC-07.2, AC-07.4, AC-07.6

---

## Entrega 7 — Integração do `App`

### T-43 — Shell do `App` com busca e estado inicial
- **Tipo:** UI
- **Descrição:** `App` com `selectedCity` em `useState`, layout glass, `CitySearch` e
  a instrução inicial quando não há cidade. Sem clima ainda (entra em T-51).
- **Critérios de aceite:**
  - [ ] Sem cidade: mostra `Pesquise uma cidade para ver o clima.` (AC-07.8).
  - [ ] Selecionar cidade grava `selectedCity`.
  - [ ] `App` não importa `services/` (plano 1.2).
- **Dependências:** T-04, T-31, T-37, T-42
- **Arquivos prováveis:** `src/App.tsx`, `src/main.tsx`
- **Rastreia:** RF-02, AC-07.8, RNF-10

### T-51 — Integrar clima e unidade no `App`
- **Tipo:** UI
- **Descrição:** ligar `useWeather(selectedCity)` a `WeatherPanel`, adicionar
  `unit` em `useState<Unit>('celsius')` e `UnitToggle`. Trocar de cidade limpa o
  estado de clima anterior.
- **Critérios de aceite:**
  - [ ] Unidade inicia em Celsius a cada carregamento (AC-06.1, E-17).
  - [ ] Trocar a unidade não dispara requisição (plano 5.3).
  - [ ] `21,4 °C → °F → °C` volta a `21 °C` (AC-05.4).
  - [ ] Nada é salvo em `localStorage`, `sessionStorage` ou cookie (RF-06).
- **Dependências:** T-43, T-49, T-50
- **Arquivos prováveis:** `src/App.tsx`
- **Rastreia:** RF-02, RF-03, RF-04, RF-05, RF-06, AC-05.4, AC-06.1


---

## Entrega 8 — Testes unitários e de integração

### T-11 — Testes unitários de temperatura
- **Tipo:** Test
- **Descrição:** cobrir conversão, arredondamento em empate e ida e volta. Os
  títulos dos testes citam o ID do critério (9.2 do plano).
- **Critérios de aceite:**
  - [ ] `AC-05.2`: converte 0, 100, −40 e 37.
  - [ ] `AC-05.4`: `21,4 °C → °F → °C` volta a `21 °C`.
  - [ ] `RN-05`: empates de arredondamento.
  - [ ] `pnpm test` passa.
- **Dependências:** T-10
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`
- **Rastreia:** AC-05.1, AC-05.2, AC-05.4, RN-05

### T-13 — Testes unitários de formatação de datas
- **Tipo:** Test
- **Descrição:** cobrir formatos e o caso de virada de dia.
- **Critérios de aceite:**
  - [ ] `RN-08`: `HH:mm` e `dd/mm/aaaa` com entradas válidas.
  - [ ] `E-15`: horário perto da meia-noite mantém a data local da cidade.
  - [ ] `pnpm test` passa.
- **Dependências:** T-12
- **Arquivos prováveis:** `tests/unit/lib/dateFormat.test.ts`
- **Rastreia:** RN-08, E-15

### T-15 — Testes unitários de nome de cidade
- **Tipo:** Test
- **Descrição:** cobrir os casos com e sem `admin1`.
- **Critérios de aceite:**
  - [ ] `AC-02.2`: `Curitiba, Paraná, Brasil`.
  - [ ] `AC-02.2`: `admin1 = null` retorna `Nome, País`.
  - [ ] `pnpm test` passa.
- **Dependências:** T-14
- **Arquivos prováveis:** `tests/unit/lib/cityLabel.test.ts`
- **Rastreia:** AC-02.2

### T-18 — Testes unitários da tabela WMO e dos textos
- **Tipo:** Test
- **Descrição:** uma asserção por linha da tabela (parametrizada) e verificação
  de que todas as chaves de `WeatherLabelKey` têm texto.
- **Critérios de aceite:**
  - [ ] `AC-10.3`: cada código da tabela retorna o grupo esperado.
  - [ ] `AC-10.2` e `AC-03.5`: `999` e `null` retornam `unknown` e o texto `Condição indisponível`.
  - [ ] Toda `WeatherLabelKey` tem entrada em `pt-BR.ts`.
- **Dependências:** T-16, T-17
- **Arquivos prováveis:** `tests/unit/lib/weatherCode.test.ts`, `tests/unit/text/pt-BR.test.ts`
- **Rastreia:** AC-10.1, AC-10.2, AC-10.3, AC-03.5, RNF-07

### T-22 — Teste live opcional dos endpoints
- **Tipo:** Test
- **Descrição:** teste que chama a Open-Meteo de verdade, marcado para o job `live`
  e fora do `pnpm test` padrão. Valida os mesmos pontos de T-21.
- **Critérios de aceite:**
  - [ ] O teste não roda no `pnpm test` padrão.
  - [ ] Roda no job `live` e falha com mensagem clara se a API mudar o contrato.
- **Dependências:** T-21
- **Arquivos prováveis:** `tests/unit/services/endpoints.spike.test.ts`
- **Rastreia:** A-12, OQ-08 (D-06)

### T-25 — Testes dos mappers
- **Tipo:** Test
- **Descrição:** usar as fixtures para cobrir os cenários dos dois mappers.
- **Critérios de aceite:**
  - [ ] `AC-01.5` e `E-28`: `latitude` string é descartada.
  - [ ] `AC-04.1`: 7 dias viram 5.
  - [ ] `AC-04.4` e `E-26`: dia sem máxima e mínima é omitido.
  - [ ] `AC-07.4`: sem `current` e `daily` lança `no_data`.
  - [ ] `E-27`: `null` no meio e string no lugar de número viram `null`.
  - [ ] `E-15`: a previsão começa no dia 1 sem repetir nem pular.
- **Dependências:** T-19, T-20, T-21, T-23, T-24
- **Arquivos prováveis:** `tests/unit/services/openMeteoMappers.test.ts`
- **Rastreia:** AC-01.5, AC-04.1, AC-04.4, AC-07.4, E-15, E-21, E-26, E-27, E-28, RNF-09

### T-27 — Testes do cliente HTTP
- **Tipo:** Test
- **Descrição:** `fetch` stubado com `vi.stubGlobal` e timers falsos.
- **Critérios de aceite:**
  - [ ] `AC-07.5`: timeout em 10 s com `vi.useFakeTimers`.
  - [ ] `AC-07.7`: 429 → `rate_limit`.
  - [ ] `E-10`: 500 → `server`; JSON inválido → `invalid_response`.
  - [ ] `E-12`: abort externo não produz erro.
  - [ ] `E-08`: rejeição de rede → `network`.
- **Dependências:** T-26
- **Arquivos prováveis:** `tests/unit/services/http.test.ts`
- **Rastreia:** AC-01.8, AC-07.2, AC-07.5, AC-07.7, E-08, E-09, E-10, E-11, E-12

### T-30 — Testes dos serviços
- **Tipo:** Test
- **Descrição:** `fetch` mockado (`vi.stubGlobal`) para verificar URL, `signal`, o caminho de sucesso (resposta vira tipo de domínio) e o caminho dos erros de cada serviço.
- **Critérios de aceite:**
  - [ ] `AC-01.3`: `encodeURIComponent` em `São Paulo`.
  - [ ] Parâmetros de forecast (`current`, `daily`, `timezone`, `forecast_days=5`).
  - [ ] `AC-07.6`: HTTP 400 vira `no_data`.
  - [ ] `signal` é repassado nos dois serviços.
  - [ ] Sucesso: resposta mockada de geocoding e de forecast vira `City[]` e `WeatherData` válidos.
  - [ ] Erros de rede e de JSON inválido propagam `WeatherErrorKind` em cada serviço (`network`, `invalid_response`).
- **Dependências:** T-28, T-29
- **Arquivos prováveis:** `tests/unit/services/geocodingService.test.ts`, `tests/unit/services/forecastService.test.ts`
- **Rastreia:** AC-01.3, AC-07.6, RNF-02

### T-33 — Testes do hook `useCitySearch`
- **Tipo:** Test
- **Descrição:** `renderHook`, `vi.mock` do serviço e timers falsos.
- **Critérios de aceite:**
  - [ ] `AC-01.1`: 300 ms de debounce.
  - [ ] `AC-01.2`: 1 caractere não dispara requisição.
  - [ ] `AC-01.7`: limite de 100 caracteres.
  - [ ] `E-12`/`E-29`: nova busca aborta a anterior.
  - [ ] Transições `idle → loading → success` e `→ error`.
- **Dependências:** T-31
- **Arquivos prováveis:** `tests/unit/hooks/useCitySearch.test.ts`
- **Rastreia:** AC-01.1, AC-01.2, AC-01.7, E-12, E-29

### T-34 — Testes do hook `useWeather`
- **Tipo:** Test
- **Descrição:** serviço que não resolve, para testar troca de cidade e `retry()`.
- **Critérios de aceite:**
  - [ ] `E-13`: troca de cidade aborta a requisição anterior e não muda o estado.
  - [ ] `AC-07.2`: `retry()` chama o serviço uma vez.
  - [ ] `AC-07.8`: sem cidade, estado é `idle`.
- **Dependências:** T-32
- **Arquivos prováveis:** `tests/unit/hooks/useWeather.test.ts`
- **Rastreia:** AC-02.3, AC-07.2, AC-07.8, E-13

### T-38 — Testes do `WeatherIcon`
- **Tipo:** Test
- **Descrição:** Testing Library, consultando por role e label.
- **Critérios de aceite:**
  - [ ] `AC-03.2`: nome acessível do `WeatherIcon` igual ao rótulo da condição.
- **Dependências:** T-35
- **Arquivos prováveis:** `tests/unit/components/WeatherIcon.test.tsx`
- **Rastreia:** AC-03.2

### T-39 — Testes do `StatusMessage`
- **Tipo:** Test
- **Descrição:** Testing Library, consultando por role.
- **Critérios de aceite:**
  - [ ] `AC-07.1`: loading com `role="status"` e `aria-busy="true"`.
  - [ ] `E-19`: erro com `role="alert"`.
- **Dependências:** T-36
- **Arquivos prováveis:** `tests/unit/components/StatusMessage.test.tsx`
- **Rastreia:** AC-07.1, E-19

### T-40 — Testes do `AttributionFooter`
- **Tipo:** Test
- **Descrição:** Testing Library, consultando por texto e link.
- **Critérios de aceite:**
  - [ ] `AC-09.1`: `Dados: Open-Meteo` visível.
  - [ ] `AC-09.2`: link externo com `rel="noopener"`.
- **Dependências:** T-37
- **Arquivos prováveis:** `tests/unit/components/AttributionFooter.test.tsx`
- **Rastreia:** AC-09.1, AC-09.2

### T-44 — Testes do `CitySearch`
- **Tipo:** Test
- **Descrição:** matriz 9.4 para o campo de busca, com fixtures de `AsyncState`.
- **Critérios de aceite:**
  - [ ] Matriz 9.4: loading, erro, vazio e sucesso de `CitySearch`.
  - [ ] `AC-01.7`: aviso de 100 caracteres.
  - [ ] `AC-07.2`: `Tentar novamente` chama `retry` uma vez.
- **Dependências:** T-42
- **Arquivos prováveis:** `tests/unit/components/CitySearch.test.tsx`
- **Rastreia:** AC-01.7, AC-07.1, AC-07.2, AC-07.3

### T-45 — Testes do `CityResults`
- **Tipo:** Test
- **Descrição:** teste de componente para a lista de resultados.
- **Critérios de aceite:**
  - [ ] `AC-02.1`: Enter seleciona a opção focada.
  - [ ] `AC-02.2`: nome da opção no formato `Cidade, Estado, País`.
- **Dependências:** T-41
- **Arquivos prováveis:** `tests/unit/components/CityResults.test.tsx`
- **Rastreia:** AC-02.1, AC-02.2

### T-46 — Testes de busca no `App`
- **Tipo:** Test
- **Descrição:** teste de integração da busca e da instrução inicial do `App`.
- **Critérios de aceite:**
  - [ ] `AC-07.8`: instrução inicial aparece sem cards.
  - [ ] Selecionar um resultado grava a cidade escolhida.
- **Dependências:** T-42, T-43
- **Arquivos prováveis:** `tests/unit/App.search.test.tsx`
- **Rastreia:** AC-02.1, AC-07.8

### T-52 — Testes de clima e previsão
- **Tipo:** Test
- **Descrição:** matriz 9.4 para `CurrentWeather` e `ForecastList`, com fixtures de `AsyncState`.
- **Critérios de aceite:**
  - [ ] `AC-04.2` e `AC-04.3`: 5 cards e aviso de 3 dias.
  - [ ] `AC-03.1`: temperatura, sensação, condição e horário.
  - [ ] `AC-03.6` e `AC-03.7`: métricas com unidade e `—` em valor nulo.
  - [ ] `E-21`: `—` em campo ausente.
- **Dependências:** T-47, T-48
- **Arquivos prováveis:** `tests/unit/components/CurrentWeather.test.tsx`, `tests/unit/components/ForecastList.test.tsx`
- **Rastreia:** AC-03.1, AC-03.6, AC-03.7, AC-04.2, AC-04.3, E-21

### T-53 — Testes de unidade e painel
- **Tipo:** Test
- **Descrição:** matriz 9.4 para `UnitToggle` e `WeatherPanel`.
- **Critérios de aceite:**
  - [ ] `AC-05.3`: `aria-pressed` do `UnitToggle`.
  - [ ] `AC-07.1`: loading do `WeatherPanel`.
  - [ ] `AC-07.6`: `no_data` sem botão.
- **Dependências:** T-49, T-50
- **Arquivos prováveis:** `tests/unit/components/UnitToggle.test.tsx`, `tests/unit/components/WeatherPanel.test.tsx`
- **Rastreia:** AC-05.3, AC-07.1, AC-07.6

### T-69 — Testes de estados loading, erro e vazio dos componentes

- **Tipo:** Test
- **Descrição:** cobre os três estados de `AsyncState` em `WeatherPanel` e o estado
  vazio de `CityResults`. T-53 cobre só parte do `WeatherPanel`, e T-45 não cobre o
  vazio. Esta tarefa completa os dois.
- **Critérios de aceite:**
  - [ ] `AC-07.1`: loading do `WeatherPanel` com `aria-busy="true"` e esqueleto.
  - [ ] `AC-07.6`: erro do `WeatherPanel` mostra mensagem por `WeatherErrorKind` com `Tentar novamente`, e `no_data` não mostra o botão.
  - [ ] `AC-07.3`: `CityResults` sem resultados mostra a mensagem de vazio.
  - [ ] Os estados são verificados por role (`status` e `alert`), não por texto frágil.
- **Dependências:** T-45, T-50
- **Arquivos prováveis:** `tests/unit/components/WeatherPanel.test.tsx`, `tests/unit/components/CityResults.test.tsx` (acrescenta casos ao arquivo criado em T-45)
- **Rastreia:** AC-07.1, AC-07.3, AC-07.6, RF-07

---

## Entrega 9 — Hardening (responsividade, acessibilidade e privacidade)

### T-54 — Estilos globais responsivos e fallback sem `backdrop-filter`
- **Tipo:** UI
- **Descrição:** ajustar `index.css` e `tailwind.config.js` para container fluido, sem
  largura fixa acima de 320 px, e aplicar o fundo sólido de fallback (E-20).
- **Critérios de aceite:**
  - [ ] Sem rolagem horizontal causada pelo container global em 320 px (RF-08, RNF-01).
  - [ ] Fallback de fundo sólido aplicado quando `backdrop-filter` não é suportado (E-20).
- **Dependências:** T-51
- **Arquivos prováveis:** `src/index.css`, `tailwind.config.js`
- **Rastreia:** RF-08, RNF-01, E-20

### T-55 — Reflow dos componentes de clima
- **Tipo:** UI
- **Descrição:** grade adaptativa em `ForecastList` e cards que quebram linha sem
  sobrepor conteúdo em 320 CSS px (equivalente a 400% de zoom, plano 9.3).
- **Critérios de aceite:**
  - [ ] Conteúdo não se sobrepõe em 320 px (AC-08.2).
  - [ ] Sem rolagem horizontal em 320, 375, 768 e 1280 px (AC-08.1).
- **Dependências:** T-51
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/ForecastList.tsx`, `src/components/ForecastDayCard.tsx`
- **Rastreia:** RF-08, RNF-01, AC-08.1, AC-08.2, AC-08.3, E-18

### T-56 — Acessibilidade: foco visível e contraste
- **Tipo:** UI
- **Descrição:** garantir anel de foco visível em todos os controles e contraste
  mínimo nos tokens e nas classes usadas.
- **Critérios de aceite:**
  - [ ] Foco visível em todos os controles (RNF-03).
  - [ ] Texto ≥ 4,5:1 e elementos gráficos ≥ 3:1 (RNF-03).
- **Dependências:** T-51
- **Arquivos prováveis:** `src/index.css`, `tailwind.config.js`
- **Rastreia:** RNF-03, E-19

### T-57 — Acessibilidade: teclado e semântica
- **Tipo:** UI
- **Descrição:** ordem de tabulação visual, Enter seleciona a cidade, e labels e roles
  corretos nos componentes de busca.
- **Critérios de aceite:**
  - [ ] Tab segue a ordem visual (RNF-03).
  - [ ] Enter seleciona a cidade (AC-02.1).
  - [ ] Nome acessível do `WeatherIcon` preservado (AC-03.2).
- **Dependências:** T-51
- **Arquivos prováveis:** `src/components/CitySearch.tsx`, `src/components/CityResults.tsx`
- **Rastreia:** RNF-03, AC-02.1, AC-03.2

### T-58 — Revisão de privacidade e segurança
- **Tipo:** Infra
- **Descrição:** confirmar que o app não pede geolocalização, não usa storage
  persistente, não tem telemetria, não tem chave de API e só faz HTTPS.
- **Critérios de aceite:**
  - [ ] Nenhum uso de `navigator.geolocation`, `localStorage`, `sessionStorage`, `IndexedDB` ou cookie em `src/`.
  - [ ] Nenhuma credencial no código (RNF-09).
  - [ ] Todas as URLs de API começam com `https://`.
- **Dependências:** T-51
- **Arquivos prováveis:** `src/**/*.{ts,tsx}`
- **Rastreia:** RNF-05, RNF-09, RF-06, RN-06

---

## Entrega 10 — E2E, desempenho e fechamento

### T-59 — E2E do fluxo principal
- **Tipo:** Test
- **Descrição:** buscar, selecionar, ver clima, trocar unidade e ver previsão, com
  `page.route` usando as fixtures.
- **Critérios de aceite:**
  - [ ] Roda em Chromium, Firefox e WebKit (RNF-11).
  - [ ] Cobre RF-01 a RF-05 com fixtures, sem API real.
- **Dependências:** T-07, T-19, T-20, T-51
- **Arquivos prováveis:** `tests/e2e/main-flow.spec.ts`
- **Rastreia:** RF-01, RF-02, RF-03, RF-04, RF-05, RNF-11

### T-60 — E2E de estados e erros
- **Tipo:** Test
- **Descrição:** respostas 5xx, 429, timeout, JSON inválido, busca vazia, `no_data`
  e `Tentar novamente` com uma requisição.
- **Critérios de aceite:**
  - [ ] Cada erro mostra mensagem e botão, exceto `no_data` (RNF-04).
  - [ ] `AC-07.2`: retry faz exatamente uma requisição.
  - [ ] `AC-07.3`: busca vazia mostra a mensagem de vazio.
- **Dependências:** T-59
- **Arquivos prováveis:** `tests/e2e/errors.spec.ts`
- **Rastreia:** RNF-04, AC-07.2, AC-07.3, AC-07.5, AC-07.6, AC-07.7

### T-61 — E2E de responsividade
- **Tipo:** Test
- **Descrição:** viewports 320×568, 375, 768 e 1280. Sem rolagem horizontal e sem
  sobreposição, com `getBoundingClientRect`.
- **Critérios de aceite:**
  - [ ] `AC-08.1`: sem rolagem horizontal em 320.
  - [ ] `AC-08.2`: sem sobreposição de elementos visíveis.
  - [ ] `AC-03.3`: não existe o texto `UV`; `AC-03.6`: `Umidade`, `Vento`, `Precipitação` e `Pressão` aparecem.
- **Dependências:** T-54, T-55, T-59
- **Arquivos prováveis:** `tests/e2e/responsive.spec.ts`
- **Rastreia:** RF-08, RNF-01, AC-08.1, AC-08.2, AC-03.3, E-18

### T-70 — E2E do fluxo principal em viewport mobile

- **Tipo:** Test
- **Descrição:** repete o fluxo de T-59 (buscar, selecionar, ver clima, trocar unidade e
  ver previsão) em viewport mobile de 375×667, com `isMobile` e `hasTouch`. Usa
  `page.route` com as fixtures, sem API real.
- **Critérios de aceite:**
  - [ ] O fluxo completo termina sem erro em 375×667.
  - [ ] `AC-08.1`: sem rolagem horizontal ao final do fluxo.
  - [ ] Roda em Chromium, Firefox e WebKit (RNF-11).
- **Dependências:** T-54, T-55, T-59
- **Arquivos prováveis:** `tests/e2e/main-flow-mobile.spec.ts`
- **Rastreia:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-08, RNF-01, RNF-11, AC-08.1

### T-62 — E2E de acessibilidade
- **Tipo:** Test
- **Descrição:** `@axe-core/playwright` nas telas principais e teste de teclado.
- **Critérios de aceite:**
  - [ ] Zero violações `critical` ou `serious` (RNF-03).
  - [ ] Tab em ordem visual; Enter seleciona a cidade (AC-02.1).
- **Dependências:** T-56, T-57, T-59
- **Arquivos prováveis:** `tests/e2e/a11y.spec.ts`
- **Rastreia:** RNF-03, AC-02.1, E-19, E-20

### T-63 — E2E de privacidade e atribuição
- **Tipo:** Test
- **Descrição:** captura de rede e permissões durante o fluxo principal.
- **Critérios de aceite:**
  - [ ] Nenhuma requisição a domínios de analytics e nenhum pedido de geolocalização (RNF-05).
  - [ ] Nada persistido após recarregar (AC-06.2, AC-06.3).
  - [ ] `AC-09.1`: `Dados: Open-Meteo` visível.
- **Dependências:** T-58, T-59
- **Arquivos prováveis:** `tests/e2e/privacy.spec.ts`
- **Rastreia:** RNF-05, AC-06.2, AC-06.3, AC-09.1

### T-64 — E2E de virada de dia
- **Tipo:** Test
- **Descrição:** fixture com `current.time` perto de meia-noite no fuso da cidade.
- **Critérios de aceite:**
  - [ ] `E-15`: a previsão começa no dia 1 sem repetir nem pular dias.
  - [ ] A data exibida segue o fuso da cidade, não o do navegador.
- **Dependências:** T-20, T-59
- **Arquivos prováveis:** `tests/e2e/day-rollover.spec.ts`
- **Rastreia:** E-15, RN-08

### T-65 — E2E de PWA offline
- **Tipo:** Test
- **Descrição:** carregar a página, `context.setOffline(true)`, buscar e ver a
  mensagem de rede.
- **Critérios de aceite:**
  - [ ] A shell abre offline (RNF-08).
  - [ ] A busca offline mostra a mensagem de AC-07.2.
  - [ ] Manifest e service worker presentes na resposta.
- **Dependências:** T-05, T-06, T-60
- **Arquivos prováveis:** `tests/e2e/offline.spec.ts`
- **Rastreia:** RNF-08, E-08, AC-07.2

### T-66 — Teste de desempenho (job separado)
- **Tipo:** Test
- **Descrição:** medir com perfil "Slow 4G" no Chromium, 30 execuções por fluxo,
  fora do CI de cada PR (plano 9.3).
- **Critérios de aceite:**
  - [ ] p75 ≤ 2 s da submissão da busca até a lista.
  - [ ] p75 ≤ 2 s da seleção até o clima atual.
- **Dependências:** T-59
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`
- **Rastreia:** RNF-02

### T-67 — Documentação de execução no README
- **Tipo:** Infra
- **Descrição:** documentar no README os comandos de instalação, lint, build, testes
  unitários, E2E e o job `live`.
- **Critérios de aceite:**
  - [ ] README lista `pnpm install`, `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm test:e2e` e `pnpm test:e2e:live`.
  - [ ] Aviso de que o job `live` depende de rede externa.
- **Dependências:** T-01, T-07
- **Arquivos prováveis:** `README.md`
- **Rastreia:** O-4

### T-68 — Fechamento: pipeline verde e matriz de cobertura
- **Tipo:** Infra
- **Descrição:** rodar os comandos do checklist e conferir que cada AC tem pelo
  menos um teste.
- **Critérios de aceite:**
  - [ ] `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` passam.
  - [ ] Cada `AC-*` aparece no título de pelo menos um teste (RNF-06).
- **Dependências:** T-08, T-11, T-13, T-15, T-18, T-25, T-27, T-30, T-33, T-34, T-38, T-39, T-40, T-44, T-45, T-46, T-52, T-53, T-69, T-59, T-60, T-61, T-62, T-63, T-64, T-65, T-66, T-67, T-70
- **Arquivos prováveis:** nenhum arquivo novo; ajustes pontuais onde o checklist falhar
- **Rastreia:** RNF-06

---

## Resumo por entrega

| Entrega | Tarefas | Foco |
| --- | --- | --- |
| 0 — Fundação | T-01 a T-08 | Base, Vitest, tema, PWA e E2E |
| 1 — Tipos e funções puras | T-09, T-10, T-12, T-14, T-16, T-17 | Tipos, lib e textos |
| 2 — Serviços (dados) | T-19 a T-21, T-23, T-24, T-26, T-28, T-29 | Fixtures, captura real, mappers, HTTP e serviços |
| 3 — Hooks | T-31, T-32 | Estado assíncrono |
| 4 — Componentes base | T-35 a T-37 | Ícone, status e atribuição |
| 5 — Componentes de busca | T-41, T-42 | Lista de resultados e campo de busca |
| 6 — Componentes de clima | T-47 a T-50 | Cartão atual, previsão, unidade e painel |
| 7 — Integração | T-43, T-51 | Shell do `App`, clima e unidade |
| 8 — Testes unitários e de integração | T-11, T-13, T-15, T-18, T-22, T-25, T-27, T-30, T-33, T-34, T-38 a T-40, T-44 a T-46, T-52, T-53, T-69 | Testes de cada camada, após a integração |
| 9 — Hardening | T-54 a T-58 | Responsividade, a11y e privacidade |
| 10 — E2E, desempenho e fechamento | T-59 a T-68, T-70 | Fluxos (incluindo mobile), desempenho, documentação e pipeline |

## Ordem de execução sugerida

`T-01 → T-02 → T-03, T-04, T-05 → T-06, T-07 → T-08` (fundação) →
`T-09` (tipos) → `T-10, T-12, T-14, T-16, T-17` (funções puras e textos) →
`T-19, T-20 → T-21 → T-23, T-24, T-26 → T-28, T-29` (serviços) →
`T-31, T-32` (hooks) → `T-35, T-36, T-37, T-41, T-42, T-47, T-48, T-49, T-50`
(componentes) → `T-43, T-51` (integração) → testes da seção 8 → `T-54 … T-58`
(hardening) → `T-59 … T-67`, `T-70` (E2E, incluindo mobile) → `T-68` (fechamento).

Dentro de cada fase, tarefas sem dependência entre si podem ser feitas em paralelo.
Os fixtures T-19 e T-20 ficam na fase de serviços porque os mappers dependem deles.

## Prioridade, tamanho e fatias verticais

**Prioridade:** P0 = sem a tarefa o fluxo principal, a atribuição ou o fechamento não funcionam. P1 = requisito de qualidade, a11y, teste ou documentação exigido pela spec. P2 = desejável ou opcional.

**Tamanho:** P = 1 arquivo simples ou configuração. M = 1 a 2 arquivos com lógica ou matriz de casos. G = 3 ou mais arquivos ou dependência externa de risco. Nenhuma tarefa ficou G após a quebra da v0.2.

**Fatias verticais:** cada fatia entrega algo que pode ser visto ou testado no navegador. As fatias respeitam as dependências da seção de cada tarefa. Os testes ficam na fatia 5, como aprovado na ordem por fase. Ver a decisão abaixo.

| ID | Título curto | Prioridade | Tamanho | Fatia |
| --- | --- | --- | --- | --- |
| T-01 | Validar base do projeto | P0 | P | 0 |
| T-02 | Esqueleto de `src/` | P0 | P | 0 |
| T-03 | Vitest e Testing Library | P1 | P | 0 |
| T-04 | Tema Tailwind glassmorphism | P1 | P | 0 |
| T-05 | Plugin e manifest PWA | P1 | M | 4 |
| T-06 | Ícones PWA | P1 | P | 4 |
| T-07 | Configurar Playwright | P1 | P | 0 |
| T-08 | Smoke E2E | P1 | P | 0 |
| T-09 | Tipos de domínio | P0 | P | 1 |
| T-10 | Conversão de temperatura | P0 | P | 2 |
| T-11 | Testes de temperatura | P1 | P | 5 |
| T-12 | Formatação de datas | P0 | P | 2 |
| T-13 | Testes de datas | P1 | P | 5 |
| T-14 | Nome de exibição da cidade | P0 | P | 1 |
| T-15 | Testes de nome de cidade | P1 | P | 5 |
| T-16 | Tabela WMO | P0 | M | 1 |
| T-17 | Textos pt-BR | P0 | P | 1 |
| T-18 | Testes da WMO e dos textos | P1 | P | 5 |
| T-19 | Fixtures de geocoding | P1 | P | 1 |
| T-20 | Fixtures de forecast | P1 | P | 1 |
| T-21 | Captura de respostas reais | P0 | M | 1 |
| T-22 | Teste live opcional | P2 | P | 5 |
| T-23 | Mapper de geocoding | P0 | P | 1 |
| T-24 | Mapper de forecast | P0 | M | 2 |
| T-25 | Testes dos mappers | P1 | M | 5 |
| T-26 | Cliente HTTP | P0 | M | 1 |
| T-27 | Testes do cliente HTTP | P1 | M | 5 |
| T-28 | Serviço de geocoding | P0 | P | 1 |
| T-29 | Serviço de forecast | P0 | P | 2 |
| T-30 | Testes dos serviços | P1 | M | 5 |
| T-31 | Hook `useCitySearch` | P0 | M | 1 |
| T-32 | Hook `useWeather` | P0 | M | 2 |
| T-33 | Testes de `useCitySearch` | P1 | P | 5 |
| T-34 | Testes de `useWeather` | P1 | P | 5 |
| T-35 | `WeatherIcon` | P1 | P | 2 |
| T-36 | `StatusMessage` | P0 | P | 1 |
| T-37 | `AttributionFooter` | P0 | P | 1 |
| T-38 | Testes de `WeatherIcon` | P2 | P | 5 |
| T-39 | Testes de `StatusMessage` | P1 | P | 5 |
| T-40 | Testes de `AttributionFooter` | P2 | P | 5 |
| T-41 | `CityResults` | P0 | M | 1 |
| T-42 | `CitySearch` | P0 | M | 1 |
| T-43 | Shell do `App` | P0 | M | 1 |
| T-44 | Testes de `CitySearch` | P1 | M | 5 |
| T-45 | Testes de `CityResults` | P1 | P | 5 |
| T-46 | Testes de busca no `App` | P1 | M | 5 |
| T-47 | `CurrentWeather` | P0 | M | 2 |
| T-48 | `ForecastList` e `ForecastDayCard` | P0 | M | 2 |
| T-49 | `UnitToggle` | P0 | P | 2 |
| T-50 | `WeatherPanel` | P0 | M | 2 |
| T-51 | Integrar clima e unidade no `App` | P0 | M | 2 |
| T-52 | Testes de clima e previsão | P1 | M | 5 |
| T-53 | Testes de unidade e painel | P1 | M | 5 |
| T-54 | Estilos responsivos e fallback | P1 | M | 3 |
| T-55 | Reflow dos componentes de clima | P1 | M | 3 |
| T-56 | Foco visível e contraste | P1 | M | 3 |
| T-57 | Teclado e semântica | P1 | M | 3 |
| T-58 | Revisão de privacidade | P1 | P | 3 |
| T-59 | E2E do fluxo principal | P0 | M | 5 |
| T-60 | E2E de estados e erros | P1 | M | 5 |
| T-61 | E2E de responsividade | P1 | M | 5 |
| T-62 | E2E de acessibilidade | P1 | M | 5 |
| T-63 | E2E de privacidade e atribuição | P1 | P | 5 |
| T-64 | E2E de virada de dia | P2 | P | 5 |
| T-65 | E2E de PWA offline | P1 | M | 4 |
| T-66 | Teste de desempenho | P1 | M | 5 |
| T-67 | Documentação de execução | P1 | P | 5 |
| T-68 | Fechamento e pipeline verde | P0 | M | 5 |
| T-69 | Testes de estados dos componentes | P1 | M | 5 |
| T-70 | E2E do fluxo mobile | P1 | M | 5 |

### Sequência de fatias

- **Fatia 0 — Base visível (T-01, T-02, T-03, T-04, T-07, T-08):** a página abre com o tema glassmorphism e o smoke E2E passa.
- **Fatia 1 — Buscar cidade (T-09, T-14, T-16, T-17, T-19, T-20, T-21, T-23, T-26, T-28, T-31, T-36, T-37, T-41, T-42, T-43):** digita-se uma cidade e vê-se a lista de resultados, com estados de loading, erro e vazio. Primeiro valor visível da busca.
- **Fatia 2 — Clima e unidade (T-10, T-12, T-24, T-29, T-32, T-35, T-47 a T-51):** seleciona-se a cidade e vê-se o clima atual, a previsão de 5 dias e a troca de °C e °F. Esta fatia entrega o MVP funcional (RF-01 a RF-05).
- **Fatia 3 — Responsividade e acessibilidade (T-54 a T-58):** o app passa a funcionar em 320 px, com foco, teclado e contraste.
- **Fatia 4 — PWA offline (T-05, T-06, T-65):** o app pode ser instalado e a shell abre sem rede.
- **Fatia 5 — Testes, desempenho e fechamento (demais tarefas):** cobertura de unidade, E2E e pipeline verde.

### Decisão pendente

A ordem aprovada coloca os testes só na fatia 5. Isso significa que as fatias 1 a 4 são validadas só à mão. Como alternativa, cada teste pode subir para a fatia do código que ele cobre, sem quebrar nenhuma dependência. Isso muda a ordem aprovada, então depende da sua confirmação.

## Tabela de correspondência v0.1 → v0.2

| v0.1 | v0.2 | Observação |
| --- | --- | --- |
| T-01 | T-01 | Sem mudança |
| T-02 | T-02, T-03 | Skeleton de `src/` e Vitest separados |
| T-03 | T-04 | Sem mudança |
| T-04 | T-05, T-06 | Plugin/manifest e ícones separados |
| T-05 | T-07, T-08 | Config Playwright e smoke E2E separados |
| T-06 … T-15 | T-09 … T-18 | Renumeração |
| T-16 | T-19, T-20 | Fixtures de geocoding e forecast |
| T-17 | T-21, T-22 | Captura real e teste live opcional |
| T-18 … T-32 | T-23 … T-37 | Renumeração |
| T-33 | T-38, T-39, T-40 | Um teste por componente |
| T-34 … T-36 | T-41 … T-43 | Renumeração |
| T-37 | T-44, T-45, T-46 | Teste por componente e do `App` |
| T-38 … T-42 | T-47 … T-51 | Renumeração |
| T-43 | T-52, T-53 | Testes divididos em dois pares de componentes |
| T-44 | T-54, T-55 | Estilos globais e reflow dos componentes |
| T-45 | T-56, T-57 | Foco/contraste e teclado/semântica |
| T-46 | T-58 | Sem mudança de conteúdo |
| T-47 … T-50 | T-59 … T-62 | Renumeração |
| T-51 | T-63, T-64 | Privacidade e virada de dia |
| T-52 | T-65 | Renumeração |
| T-53 | T-66 | Renumeração |
| T-54 | T-67, T-68 | README e fechamento separados |
