# Especificação de Produto — Aplicação de Previsão do Tempo

- **Status:** Pronta para revisão de produto (v0.5: decisões provisórias aplicadas; OQs restantes na seção 10)
- **Fonte:** [discovery.md](./discovery.md)
- **Data:** 2026-11-11
- **Escopo desta entrega:** web responsiva, instalável como PWA, em pt-BR, sem backend próprio e sem autenticação.

---

## 1. Overview

### 1.1 Problema

Pessoas que precisam decidir rapidamente (sair de casa, levar guarda-chuva, planejar uma viagem) não têm uma forma rápida, clara e acessível de consultar o clima de uma cidade em unidades de sua preferência.

### 1.2 Solução

Aplicação web que permite:

1. Buscar uma cidade pelo nome.
2. Ver o clima atual da cidade selecionada.
3. Ver a previsão dos próximos 5 dias (hoje + 4 dias).
4. Alternar entre Celsius e Fahrenheit.

Toda a lógica roda no cliente. Os dados vêm da API Open-Meteo (geocoding e forecast), sem API key.

### 1.3 Objetivos

| ID  | Objetivo                                                     | Métrica de sucesso                                                                                       |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| O-1 | Responder "vai chover ou fazer frio?" sem esforço            | Tempo entre abrir o app e ver o clima atual: meta de ≤ 2 s em p75, 4G (ver RNF-02)                    |
| O-2 | Permitir comparar cidades em sequência                       | Teste de usabilidade: comparar duas cidades sem ajuda (meta a definir, OQ-11); sem telemetria (RNF-05)                          |
| O-3 | Ser utilizável com leitor de tela e zoom de até 400%             | Conclusão da tarefa "ver o clima atual" sem ajuda em testes com usuários (a definir, ver OQ-11)          |
| O-4 | Entregar com qualidade verificável                           | `pnpm lint`, `pnpm build` e `pnpm test` passando; testes unitários e E2E cobrindo os critérios de aceite |

### 1.4 Personas (hipóteses a validar)

| Persona | Contexto de uso | Objetivo principal |
| ------- | --------------- | ------------------ |
| **Ana**, planejadora do dia a dia | Mobile, consulta rápida em pé ou no transporte, rede 4G ou Wi-Fi instável | Saber se vai chover ou fazer frio na cidade pesquisada |
| **Carlos**, planejador de viagens e operações | Desktop, com várias abas e consultas em sequência | Comparar a previsão de 5 dias de várias cidades |
| **Marina**, usuária com baixa visão | Mobile com leitor de tela (VoiceOver ou TalkBack) e zoom de até 400% | Ver a temperatura atual e a previsão de amanhã sem ajuda |

> As personas são hipóteses até a confirmação do público-alvo (OQ-11).

---

## 2. Functional Requirements

| ID    | Requisito                                                                                                                                                                    | Origem                    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| RF-01 | O sistema deve permitir buscar cidades pelo nome, em campo de texto com sugestões/resultados.                                                                                | Discovery RF-01           |
| RF-02 | O sistema deve permitir selecionar uma cidade a partir dos resultados da busca.                                                                                              | Discovery RF-02           |
| RF-03 | O sistema deve exibir o clima atual da cidade selecionada: temperatura, sensação térmica, condição com ícone, umidade, vento, precipitação, pressão e horário da última atualização.                                | Discovery RF-03, R-04     |
| RF-04 | O sistema deve exibir a previsão para 5 dias (hoje + 4 dias), com máxima, mínima e condição por dia.                                                                         | Discovery RF-04, Decisões |
| RF-05 | O sistema deve permitir alternar a unidade de temperatura entre Celsius e Fahrenheit, aplicando a mudança a todos os valores exibidos.                                      | Discovery RF-05           |
| RF-06 | O sistema não deve persistir preferências. A unidade volta a Celsius a cada visita.                                                                                          | Discovery RF-06, Q1       |
| RF-07 | O sistema deve tratar os estados de loading, erro e vazio em busca, clima atual e previsão.                                                                                  | Discovery RF-07           |
| RF-08 | O sistema deve ter layout responsivo, sem rolagem horizontal, a partir de 320 px de largura.                                                                                                     | Discovery RF-08           |
| RF-09 | O sistema deve exibir a atribuição de crédito à Open-Meteo, com link para o provedor, em todas as telas que exibem dados meteorológicos.                                    | Derivado de R-08          |
| RF-10 | O sistema deve traduzir o código de condição meteorológica da Open-Meteo (`weather_code`) em texto em pt-BR e ícone correspondente, usado em RF-03 e RF-04. Códigos fora do mapeamento seguem AC-10.2. | Derivado de Discovery RF-03/RF-04 |

### 2.1 Regras de negócio

- **RN-01 — Dia 1 da previsão:** o dia atual é o dia 1 da previsão de 5 dias.
- **RN-02 — Fonte única:** todos os valores de temperatura vêm da API em Celsius. A conversão para Fahrenheit ocorre apenas na apresentação, a partir do valor bruto da API; o arredondamento é aplicado somente ao resultado final (fórmula: `F = C × 9/5 + 32`; arredondamento conforme RN-05).
- **RN-03 — Dados exibidos:** temperatura, sensação térmica, condição/ícone, umidade, vento, precipitação e pressão (clima atual) e máx./mín./condição (previsão). Índice UV, previsão horária e geolocalização estão fora de escopo. Unidades do clima atual: umidade em %, vento em km/h, precipitação em mm e pressão em hPa.
- **RN-04 — Idioma:** todos os textos da interface em pt-BR, centralizados em um módulo de textos para facilitar eventual i18n futuro (R-15).
- **RN-05 — Arredondamento (provisório, OQ-09):** valores exibidos são arredondados para o inteiro mais próximo; em empate (x,5), arredonda-se para o valor maior (ex.: 2,5 → 3; −2,5 → −2).
- **RN-06 — Sem cache de dados (provisório, OQ-09):** nenhum dado meteorológico é armazenado nem reutilizado entre seleções; cada seleção de cidade gera nova requisição.
- **RN-07 — Escopo geográfico (provisório, OQ-14):** a busca usa o geocoding global da Open-Meteo, sem filtro por país.
- **RN-08 — Formatos pt-BR (provisório, OQ-15):** decimal com vírgula (`21,4`), horário de 24 h (`HH:mm`) e data `dd/mm/aaaa`.

---

## 3. User Stories

Formato: **Como [persona], quero [ação] para [valor].** Cada story indica os RFs que a atendem.

- **US-01 — Buscar e selecionar cidade.** Como Ana, quero buscar uma cidade pelo nome e selecioná-la na lista de resultados para ver o clima do lugar que me interessa.
  - *RF:* RF-01, RF-02
- **US-02 — Clima atual.** Como Ana, quero ver a temperatura atual, a sensação térmica e a condição do tempo da cidade selecionada para saber se vai chover ou fazer frio.
  - *RF:* RF-03
- **US-03 — Previsão de 5 dias.** Como Ana, quero ver a máxima, a mínima e a condição de cada um dos próximos 5 dias para planejar minha semana.
  - *RF:* RF-04
- **US-04 — Comparar cidades na mesma tela.** Como Carlos, quero buscar outra cidade e ver sua previsão sem sair da tela para comparar destinos de viagem.
  - *RF:* RF-01, RF-02, RF-04
- **US-05 — Alternar unidade de temperatura.** Como Carlos, quero alternar entre Celsius e Fahrenheit para ler os valores na unidade que uso no trabalho.
  - *RF:* RF-05 (com RF-06: a unidade volta a Celsius a cada visita)
- **US-06 — Consultar com leitor de tela e zoom.** Como Marina, quero navegar por teclado e leitor de tela, com zoom de até 400%, para ver a temperatura atual, a previsão de amanhã e a unidade sem ajuda.
  - *RF:* RF-03, RF-04, RF-05 (com RNF-03 para a conformidade de acessibilidade)
- **US-07 — Recuperar de erro.** Como Ana, quero ver uma mensagem clara e poder tentar de novo quando a consulta falhar para não ficar sem resposta.
  - *RF:* RF-07
- **US-08 — Consultar no celular.** Como Ana, quero consultar o clima no celular, em tela pequena e sem rolagem horizontal, para decidir rapidamente em movimento.
  - *RF:* RF-08
- **US-09 — Saber a origem e a atualidade dos dados.** Como Carlos, quero saber de onde vêm os dados e quando foram atualizados para avaliar a confiança na previsão.
  - *RF:* RF-03 (horário da última atualização), RF-09 (atribuição à Open-Meteo)

### 3.1 Matriz de rastreabilidade

| US     | Requisitos funcionais | Acceptance Criteria                                          | RNF relevantes         |
| ------ | --------------------- | ------------------------------------------------------------ | ---------------------- |
| US-01  | RF-01, RF-02          | AC-01.1 a AC-01.8, AC-02.1 a AC-02.3, AC-07.3                | RNF-02, RNF-03, RNF-07 |
| US-02  | RF-03, RF-10          | AC-03.1, AC-03.2, AC-03.3, AC-03.5, AC-10.1 a AC-10.3        | RNF-02, RNF-03, RNF-07 |
| US-03  | RF-04, RF-10          | AC-04.1 a AC-04.4, AC-10.1, AC-10.3                          | RNF-01, RNF-02, RNF-07 |
| US-04  | RF-01, RF-02, RF-04   | AC-01.1, AC-02.1 a AC-02.3, AC-04.1, AC-07.1                 | RNF-02                 |
| US-05  | RF-05, RF-06          | AC-05.1 a AC-05.4, AC-06.1                                   | RNF-03, RNF-07         |
| US-06  | RF-03, RF-04, RF-05   | AC-03.2, AC-04.2, AC-05.3, AC-07.1, AC-08.3, AC-09.2         | RNF-01, RNF-03, RNF-07 |
| US-07  | RF-07                 | AC-01.8, AC-07.1 a AC-07.8                                   | RNF-02, RNF-04         |
| US-08  | RF-08                 | AC-08.1 a AC-08.3                                            | RNF-01, RNF-03         |
| US-09  | RF-03, RF-09          | AC-03.4, AC-09.1, AC-09.2                                    | RNF-03                 |

- **Transversais:** RNF-05, RNF-06, RNF-09, RNF-10 e RNF-11 aplicam-se a todas as stories e não são repetidos na tabela.
- **Sem US direta:** AC-06.2 e AC-06.3 (não persistência, RF-06) verificam RNF-05 e são cobertos pela verificação transversal de privacidade.


---

## 4. Acceptance Criteria

Formato: **Given / When / Then**, com valores concretos para servir de base aos testes automatizados (unitários com Vitest e E2E com Playwright). Cada RF possui ao menos um critério. Itens marcados com "(OQ-xx)" dependem de decisão ainda aberta e devem ser ajustados quando ela for fechada.

### RF-01 — Busca de cidades

- **AC-01.1**
  - **Given** o campo de busca está vazio na tela inicial
  - **When** o usuário digita `Pa` (2 caracteres) e o debounce de 300 ms expira
  - **Then** exatamente 1 requisição é feita ao endpoint de geocoding da Open-Meteo com `name=Pa`, e a lista exibe um item por resultado, com nome, região (quando houver) e país
- **AC-01.2**
  - **Given** o campo de busca contém `C` (1 caractere)
  - **When** o usuário pressiona Enter
  - **Then** nenhuma requisição é feita e nenhuma mensagem de erro é exibida
  - **And** dado o campo contendo apenas espaços (`"   "`), quando o usuário pressiona Enter, então nenhuma requisição é feita
- **AC-01.3**
  - **Given** o usuário busca `São Paulo`
  - **When** a busca é enviada
  - **Then** a requisição contém o termo codificado como `S%C3%A3o%20Paulo`
  - **And** o resultado é exibido como `São Paulo`, sem caracteres corrompidos (ex.: `SÃ£o`)
- **AC-01.4**
  - **Given** a API retorna duas cidades com o nome `Santa Rita`: uma em Paraíba, Brasil, e outra em Maranhão, Brasil
  - **When** os resultados são exibidos
  - **Then** os itens aparecem como `Santa Rita, Paraíba, Brasil` e `Santa Rita, Maranhão, Brasil`
- **AC-01.5**
  - **Given** o geocoding retorna um resultado sem `latitude` ou `longitude`, e outro com `latitude` do tipo string
  - **When** os resultados são processados
  - **Then** ambos são descartados da lista, e a aplicação não lança erro não tratado
- **AC-01.6**
  - **Given** o usuário digita `@#$%` ou `?&=`
  - **When** a busca é enviada
  - **Then** a requisição usa o termo codificado, nenhuma query string é alterada por caracteres de controle, e a tela exibe a mensagem de AC-07.3
- **AC-01.7**
  - **Given** o usuário digita um termo com 101 caracteres
  - **When** o campo recebe o 101º caractere
  - **Then** a entrada é limitada a 100 caracteres e a mensagem `Máximo de 100 caracteres` é exibida; a requisição é enviada somente com o termo de 100 caracteres
- **AC-01.8**
  - **Given** a requisição de geocoding nunca responde
  - **When** o timeout de 10 s expira
  - **Then** a requisição é abortada, o loading para e a mensagem de AC-07.2 é exibida

### RF-02 — Seleção de cidade

- **AC-02.1**
  - **Given** a lista de resultados tem 3 cidades e o foco está no primeiro item
  - **When** o usuário pressiona ↓ e depois Enter (ou clica/toca no segundo item)
  - **Then** a segunda cidade fica selecionada e são disparadas as requisições de clima atual e previsão com as coordenadas dela
- **AC-02.2**
  - **Given** a cidade `Curitiba, Paraná, Brasil` foi selecionada
  - **When** o resultado é exibido
  - **Then** o cabeçalho mostra exatamente `Curitiba, Paraná, Brasil`
- **AC-02.3**
  - **Given** a cidade A tem dados exibidos e a requisição da cidade B está pendente
  - **When** o usuário seleciona a cidade B
  - **Then** nenhum valor da cidade A permanece visível e o estado de loading é exibido até a resposta de B chegar

### RF-03 — Clima atual

- **AC-03.1**
  - **Given** o clima atual retornado é `temperature_2m` = 21,4, `apparent_temperature` = 19,8 e `weather_code` = 61, e a unidade é Celsius
  - **When** o clima atual é exibido
  - **Then** a tela mostra `21 °C`, `Sensação de 20 °C` e `Chuva leve` com ícone de chuva (arredondamento conforme RN-05)
- **AC-03.2**
  - **Given** o ícone de condição está exibido
  - **When** a árvore de acessibilidade é inspecionada
  - **Then** o ícone tem nome acessível igual à descrição da condição (ex.: `Chuva leve`) e essa descrição também aparece como texto visível
- **AC-03.3**
  - **Given** o clima atual está exibido
  - **When** a tela é inspecionada
  - **Then** não existe nenhum elemento com o texto `UV` (índice UV segue fora de escopo, Q6)
- **AC-03.4**
  - **Given** a API retorna `current.time` = `2026-11-11T15:00` no fuso da cidade
  - **When** o clima atual é exibido
  - **Then** a tela mostra o rótulo `Atualizado às 15:00` (horário de 24 h, RN-08)
- **AC-03.5**
  - **Given** a API retorna `current` com `apparent_temperature` = `null` e `weather_code` = `999` (código desconhecido)
  - **When** o clima atual é exibido
  - **Then** a sensação térmica mostra `—`, a condição mostra `Condição indisponível` com ícone genérico, e a temperatura continua exibida normalmente
- **AC-03.6**
  - **Given** a API retorna `current` com `relative_humidity_2m` = 78, `wind_speed_10m` = 12,4, `precipitation` = 0,4 e `pressure_msl` = 1013,6
  - **When** o clima atual é exibido
  - **Then** a tela mostra `Umidade 78%`, `Vento 12 km/h`, `Precipitação 0 mm` e `Pressão 1014 hPa` (arredondamento conforme RN-05)
- **AC-03.7**
  - **Given** a API retorna `current` com `relative_humidity_2m`, `wind_speed_10m`, `precipitation` e `pressure_msl` = `null`
  - **When** o clima atual é exibido
  - **Then** cada métrica mostra seu rótulo com `—` no valor, e a temperatura e a condição continuam exibidas

### RF-04 — Previsão de 5 dias

- **AC-04.1**
  - **Given** a API retorna `daily` com 7 dias a partir de hoje
  - **When** a previsão é exibida
  - **Then** exatamente 5 cards são mostrados, em ordem cronológica crescente, e o primeiro corresponde à data de hoje no fuso de referência (OQ-08)
- **AC-04.2**
  - **Given** um dia com `temperature_2m_max` = 24,6, `temperature_2m_min` = 15,2 e `weather_code` = 0, em Celsius
  - **When** o card do dia é renderizado
  - **Then** o card mostra `25 °C` (máxima), `15 °C` (mínima) e `Céu limpo` com ícone e texto visível
- **AC-04.3**
  - **Given** a API retorna `daily` com apenas 3 dias
  - **When** a previsão é renderizada
  - **Then** exatamente 3 cards são exibidos, a mensagem `Previsão incompleta: 3 de 5 dias disponíveis` aparece, e nenhum erro não tratado é lançado no console
- **AC-04.4**
  - **Given** a API retorna `daily` com `temperature_2m_max` = `null` no dia 2 e, no dia 4, `temperature_2m_max` e `temperature_2m_min` = `null`
  - **When** a previsão é renderizada
  - **Then** o dia 2 mostra `—` na máxima e a mínima normalmente, o dia 4 é omitido, e a mensagem de previsão incompleta é exibida (AC-04.3)

### RF-05 — Alternância de unidade

- **AC-05.1**
  - **Given** a API retornou, em °C, temperatura `21,4`, sensação `19,8`, máxima `24,6` e mínima `15,2`, e a tela está em Celsius (exibindo `21 °C`, `20 °C`, `25 °C` e `15 °C`)
  - **When** o usuário aciona o controle para Fahrenheit
  - **Then** a tela mostra `71 °F`, sensação `68 °F`, máxima `76 °F` e mínima `59 °F` (conversão a partir dos valores brutos, RN-02), e nenhum valor em °C permanece visível
- **AC-05.2**
  - **Given** os valores de entrada em Celsius são 0, 100, −40 e 37
  - **When** são convertidos para Fahrenheit com a fórmula `F = C × 9/5 + 32` e arredondados conforme RN-05
  - **Then** as saídas são exatamente 32, 212, −40 e 99
- **AC-05.3**
  - **Given** a unidade está em Celsius
  - **When** o usuário aciona o controle de unidade
  - **Then** o controle tem `aria-pressed="true"` em Fahrenheit (e `"false"` em Celsius), e uma região `role="status"` é atualizada com o texto `Unidade alterada para Fahrenheit`
- **AC-05.4**
  - **Given** a temperatura da API é 21,4 °C e a unidade está em Celsius
  - **When** o usuário alterna C → F → C → F → C
  - **Then** o valor final exibido é `21 °C`, igual ao valor inicial, pois a conversão parte sempre do valor bruto da API (RN-02)

### RF-06 — Sem persistência de preferências

- **AC-06.1**
  - **Given** a unidade foi alterada para Fahrenheit
  - **When** a página é recarregada
  - **Then** o controle de unidade está em Celsius e todos os valores são exibidos em °C
- **AC-06.2**
  - **Given** o usuário alternou a unidade e pesquisou ao menos uma cidade
  - **When** `localStorage`, `sessionStorage`, `document.cookie` e as bases de IndexedDB são inspecionados
  - **Then** nenhuma chave com unidade, cidade ou histórico foi gravada pela aplicação (o cache de shell do service worker, RNF-08, fica fora desta verificação; não há cache de respostas da API, RN-06)
- **AC-06.3**
  - **Given** o usuário realizou 3 buscas diferentes
  - **When** a interface é inspecionada
  - **Then** não existe elemento com os textos `Histórico` ou `Favoritos`, e nenhum registro das buscas anteriores é gravado em storage

### RF-07 — Estados de loading, erro e vazio

- **AC-07.1**
  - **Given** a requisição de busca está pendente (resposta mockada com atraso de 2 s)
  - **When** o estado da tela é inspecionado durante a espera
  - **Then** um elemento `role="status"` contém o texto `Carregando...` e o container tem `aria-busy="true"`; após a resposta, `aria-busy="false"`
- **AC-07.2**
  - **Given** a requisição de previsão retorna HTTP 500 (ou falha de rede)
  - **When** a falha ocorre
  - **Then** a tela exibe `Não foi possível carregar o clima. Tente novamente.` e um botão `Tentar novamente`
  - **And** ao clicar no botão, exatamente 1 nova requisição é feita ao mesmo endpoint, com os mesmos parâmetros
- **AC-07.3**
  - **Given** o geocoding retorna `results` vazio para o termo `xyzabc`
  - **When** a busca é concluída
  - **Then** a tela exibe `Nenhuma cidade encontrada para "xyzabc". Verifique o nome digitado.` e nenhum card de cidade
- **AC-07.4**
  - **Given** o forecast da cidade selecionada retorna sem os campos `current` e `daily`
  - **When** a cidade é selecionada
  - **Then** a tela exibe `Sem dados disponíveis para esta cidade.` e nenhum valor de temperatura é renderizado
- **AC-07.5**
  - **Given** a requisição de forecast nunca responde (mock sem resposta)
  - **When** o timeout de 10 s expira
  - **Then** a requisição é abortada, `aria-busy` volta a `"false"` e a tela exibe a mensagem de erro de AC-07.2
- **AC-07.6**
  - **Given** o geocoding retorna a cidade `Curitiba, Paraná, Brasil`, e o forecast responde HTTP 400 com motivo de coordenadas inválidas
  - **When** a cidade é selecionada
  - **Then** a tela exibe `Sem dados disponíveis para esta cidade.` (AC-07.4), e não exibe a mensagem de `Nenhuma cidade encontrada`

- **AC-07.7**
  - **Given** a API responde HTTP 429 (limite de uso)
  - **When** a falha ocorre
  - **Then** a tela exibe `Muitas consultas em pouco tempo. Tente novamente em instantes.` (E-09) e o botão `Tentar novamente`, e nenhuma mensagem genérica de erro é exibida

- **AC-07.8**
  - **Given** a aplicação é aberta sem cidade pesquisada
  - **When** a tela inicial é renderizada
  - **Then** exibe a instrução `Pesquise uma cidade para ver o clima.` e nenhum card de clima ou previsão

### RF-08 — Responsividade

- **AC-08.1**
  - **Given** viewport de 320 × 568 px
  - **When** a página principal é renderizada com uma cidade selecionada
  - **Then** `document.documentElement.scrollWidth` é menor ou igual a `clientWidth` (sem rolagem horizontal)
- **AC-08.2**
  - **Given** viewports de 320, 375, 768 e 1280 px de largura
  - **When** cada tela principal é renderizada
  - **Then** nenhum par de elementos de texto ou controles visíveis tem retângulos sobrepostos (medido por `getBoundingClientRect` no E2E), e nenhum elemento ultrapassa a largura da viewport
- **AC-08.3**
  - **Given** viewport de 1280 px com zoom de 400%, o que equivale a 320 CSS px de largura útil (WCAG 1.4.10, reflow — ver RNF-03)
  - **When** a página é carregada
  - **Then** não há rolagem horizontal e todos os controles são alcançáveis por Tab na ordem visual

### RF-09 — Atribuição de dados

- **AC-09.1**
  - **Given** o clima atual ou a previsão de uma cidade está exibida
  - **When** a tela é inspecionada
  - **Then** existe um link visível com o texto `Dados: Open-Meteo` apontando para `https://open-meteo.com/`
- **AC-09.2**
  - **Given** o link de atribuição está visível
  - **When** o usuário o aciona
  - **Then** o link tem `target="_blank"` e `rel` contendo `noopener` e `noreferrer`

### RF-10 — Mapeamento de condições meteorológicas

- **AC-10.1**
  - **Given** a API retorna um `weather_code` listado na tabela de mapeamento
  - **When** a condição é renderizada no clima atual ou na previsão
  - **Then** a tela exibe o texto em pt-BR correspondente e o ícone correspondente
- **AC-10.2**
  - **Given** a API retorna um `weather_code` fora da tabela de mapeamento
  - **When** a condição é renderizada
  - **Then** a tela exibe `Condição indisponível` com ícone genérico, sem quebrar o restante da tela
- **AC-10.3**
  - **Given** cada `weather_code` da tabela abaixo (códigos WMO usados pela Open-Meteo)
  - **When** a condição é renderizada
  - **Then** o texto e o grupo de ícone são exatamente os da linha correspondente

| weather_code     | Texto exibido                  | Grupo de ícone |
| ---------------- | ------------------------------ | -------------- |
| 0                | Céu limpo                      | sol            |
| 1                | Predominantemente limpo        | sol            |
| 2                | Parcialmente nublado           | nuvem parcial  |
| 3                | Nublado                        | nuvem          |
| 45, 48           | Nevoeiro                       | névoa          |
| 51, 53, 55       | Garoa leve, moderada ou intensa| chuva          |
| 56, 57           | Garoa congelante               | chuva          |
| 61, 63, 65       | Chuva leve, moderada ou forte  | chuva          |
| 66, 67           | Chuva congelante               | chuva          |
| 71, 73, 75       | Neve leve, moderada ou forte   | neve           |
| 77               | Grãos de neve                  | neve           |
| 80, 81, 82       | Pancadas de chuva leves, moderadas ou violentas | chuva |
| 85, 86           | Pancadas de neve               | neve           |
| 95               | Trovoada                       | trovoada       |
| 96, 99           | Trovoada com granizo           | trovoada       |

---

## 5. Non-Functional Requirements

| ID     | Categoria        | Requisito                                                                                                                      | Critério verificável                                                                                                                                                             |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Responsividade   | Layout utilizável em telas a partir de 320 px, sem rolagem horizontal.                                                         | Teste E2E de viewport 320 px sem overflow horizontal (ver AC-08.1).                                                                                                              |
| RNF-02 | Desempenho       | Resultados de busca e clima exibidos em até 2 s em 4G típico (meta provisória, ver seção 10).                                        | Playwright com perfil de rede "Slow 4G" (o mesmo do Lighthouse), 30 execuções por fluxo. Fluxos: da submissão da busca até a lista; da seleção até o clima atual exibido. p75 ≤ 2 s em ambos.                                                                      |
| RNF-03 | Acessibilidade   | Conformidade com WCAG 2.1 AA: labels, navegação por teclado, foco visível e contraste adequado no tema dark glassmorphism.    | Texto ≥ 4,5:1 e componentes/elementos gráficos ≥ 3:1; zero violações de impacto *critical* ou *serious* em auditoria axe-core nas telas principais; navegação completa por teclado.                            |
| RNF-04 | Confiabilidade   | Falhas da API devem exibir a mensagem de erro do tipo de falha e o botão `Tentar novamente`.                                        | Teste com API mockada retornando 5xx, 429, timeout e JSON inválido: mensagem e botão presentes em todos os casos (ver AC-07.2, AC-07.5 e AC-07.7).                                        |
| RNF-05 | Privacidade      | Não solicitar geolocalização, não coletar dados pessoais e não usar telemetria de uso.                                         | Teste E2E com captura de rede: nenhuma requisição a domínios de analytics; nenhuma solicitação de permissão de localização; nenhum cookie de terceiros.                                 |
| RNF-06 | Qualidade        | Cobertura de testes unitários e E2E dos critérios de aceite; `pnpm lint`, `pnpm build` e `pnpm test` passando.                 | Pipeline verde; cada AC mapeado a pelo menos um teste.                                                                                                                           |
| RNF-07 | Idioma           | Interface em pt-BR.                                                                                                            | Teste automatizado verifica que todos os textos de interface vêm do módulo pt-BR (RN-04); nenhum texto fora desse módulo é renderizado.                                                                               |
| RNF-08 | Instalabilidade  | Aplicação instalável como PWA, com manifest e service worker.                                                                  | Auditoria de PWA (Lighthouse) sem falhas de instalabilidade; manifest com nome, ícones e modo de exibição de app independente. Cache offline limitado à shell do app; teste E2E com contexto offline: a shell abre e a busca exibe a mensagem de AC-07.2.                       |
| RNF-09 | Segurança        | Nenhuma credencial no código; comunicação somente via HTTPS; respostas da API validadas por tipo antes de uso.                 | Revisão de código e de rede; testes unitários de validação com payloads malformados.                                                                                              |
| RNF-10 | Manutenibilidade | Acesso a dados separado da apresentação; tipos compartilhados em módulo próprio; um componente por arquivo. Detalhes de estrutura ficam no plano técnico.            | Checklist de revisão de código baseado nas convenções do plano técnico, aplicado em todo Pull Request.                                                                                                                                |
| RNF-11 | Compatibilidade | Funciona nas versões estáveis mais recentes de Chrome, Edge, Firefox e Safari (A-10). | Suíte E2E executada nos quatro navegadores, sem falhas nos critérios de aceite. |

---

## 6. Edge Cases

| #    | Cenário                                                  | Comportamento esperado                                                                                                 |
| ---- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| E-01 | Campo de busca vazio ou só espaços                       | Nenhuma requisição; nenhum erro exibido.                                                                               |
| E-02 | Termo com 1 caractere                                    | Nenhuma requisição (mínimo de 2 caracteres).                                                                    |
| E-03 | Termo sem resultados                                     | Estado vazio com sugestão de revisar o texto (AC-07.3).                                                                |
| E-04 | Homônimos (ex.: duas cidades "Santa Rita")               | Ambas listadas com região e país visíveis; ordem definida por critério de relevância (OQ-07).                          |
| E-05 | Caracteres especiais, acentos, emojis ou HTML no termo   | Termo tratado como texto; nenhuma injeção de HTML; sem erro.                                                           |
| E-06 | Cidade sem dados de clima ou previsão                    | Mensagem específica de "sem dados disponíveis" (AC-07.4).                                                              |
| E-07 | Previsão com menos de 5 dias                             | Dias disponíveis exibidos com indicação de dados incompletos (AC-04.3).                                                |
| E-08 | Falha de rede (offline ou DNS)                           | Mensagem de erro com botão "Tentar novamente" (AC-07.2). A shell do app abre, mas nenhum dado offline é exibido (RNF-08, RN-06).                                                               |
| E-09 | HTTP 429 (limite de uso da API)                          | Mensagem específica de limite de uso e botão `Tentar novamente` (AC-07.7).                    |
| E-10 | HTTP 5xx ou resposta inválida/JSON malformado            | Mensagem de erro genérica; nenhum dado parcial exibido como válido.                                                    |
| E-11 | Timeout da requisição                                    | Loading encerrado e erro exibido (AC-07.5). Timeout de 10 s.                                                 |
| E-12 | Duas buscas rápidas em sequência                         | Somente o resultado da última busca é exibido (respostas antigas descartadas, sem race condition).                    |
| E-13 | Usuário troca de cidade durante um carregamento          | A requisição anterior é cancelada ou ignorada; a tela mostra apenas a cidade mais recente.                            |
| E-14 | Temperatura negativa e valores decimais                  | Exibidos corretamente; conversão e arredondamento conforme RN-05 (ex.: −40 °C = −40 °F).                      |
| E-15 | Virada de dia perto da meia-noite                        | Dia 1 da previsão segue o fuso de referência definido em OQ-08; sem pular ou repetir dias.                            |
| E-16 | Alternância de unidade enquanto há carregamento          | Unidade aplicada aos dados já exibidos e aos que chegarem; sem erro.                                                   |
| E-17 | Recarregar a página com unidade em Fahrenheit            | Volta a Celsius (RF-06).                                                                                               |
| E-18 | Tela muito estreita (320 px) com nomes de cidade longos  | Texto quebra ou trunca com reticências sem rolagem horizontal e sem sobreposição.                                      |
| E-19 | Leitor de tela com resultados dinâmicos                  | Resultados e erros anunciados por região `role="status"` ou `aria-live="polite"`, uma vez por atualização.                                                 |
| E-20 | Dispositivo sem suporte a `backdrop-filter`              | Fallback com fundo sólido mantendo o contraste exigido (R-09).                                                         |
| E-21 | Resposta parcial: campo ausente ou `null` em `current`   | O campo mostra `—`; os demais campos são exibidos normalmente, sem erro na tela (AC-03.5).                             |
| E-22 | Resposta parcial: `weather_code` desconhecido | Condição `Condição indisponível` com ícone genérico (AC-10.2). |
| E-23 | Termo só com símbolos (`@#$%`, `?&=`) ou com mais de 100 caracteres | Símbolos enviados codificados e tratados como sem resultados (AC-01.6). Termo acima de 100 caracteres limitado a 100 com aviso visível (AC-01.7). |
| E-24 | Timeout no geocoding                                     | Requisição abortada, loading encerrado e mensagem de erro com `Tentar novamente` (AC-01.8).                            |
| E-25 | Cidade encontrada no geocoding, mas forecast responde com erro de coordenadas | Mensagem `Sem dados disponíveis para esta cidade.`, e não a de cidade não encontrada (AC-07.6).             |
| E-26 | Resposta parcial: `daily` com `null` ou arrays de tamanhos diferentes | Valores `null` exibidos como `—`; dia sem máxima e mínima omitido; aviso de previsão incompleta (AC-04.3, AC-04.4). |
| E-27 | Resposta parcial: campo com tipo errado (ex.: texto onde se espera número) | Tratado como ausente (`—`); nenhum erro não tratado (RNF-09). |
| E-28 | Geocoding com resultado sem `latitude` ou `longitude` | Resultado descartado; demais resultados exibidos (AC-01.5). |
| E-29 | Mesmo termo enviado de novo (Enter repetido) enquanto a busca está pendente | Uma única requisição; nenhum card duplicado. |

---

## 7. Assumptions

- **A-01** A aplicação é uma SPA web com layout responsivo, instalável como PWA. Não há app nativo nesta entrega.
- **A-02** A Open-Meteo não exige API key. Adequação de volume e licença seguem pendentes (OQ-03).
- **A-03** Os dados da API são usados apenas para exibição, sem armazenamento no servidor.
- **A-04** Não há backend próprio; toda a lógica roda no cliente.
- **A-05** A previsão é de 5 dias a partir do dia atual, com dados diários (máx./mín.).
- **A-06** A conversão Celsius ↔ Fahrenheit é feita na apresentação, a partir do valor em Celsius retornado pela API.
- **A-07** Não há autenticação de usuários.
- **A-08** O idioma padrão e único da interface é pt-BR.
- **A-09** Nenhuma preferência do usuário é salva localmente nesta entrega (Q1, Q4).
- **A-10** "Últimas versões dos navegadores principais" significa Chrome, Edge, Firefox e Safari em suas versões estáveis mais recentes (decisão provisória, ver seção 10).
- **A-11** Sensação térmica e condição/ícone são mantidas em RF-03 por serem necessárias à leitura básica do clima (interpretação a confirmar, OQ-05).
- **A-12** Os dados da Open-Meteo estão disponíveis sem cadastro. Que o endpoint de forecast retorna `timezone` utilizável para datas ainda não foi verificado; a verificação ocorre na fase Plan.

---

## 8. Risks

| ID   | Risco                                                                                  | Impacto | Prob. | Mitigação                                                                                                    |
| ---- | -------------------------------------------------------------------------------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| R-01 | Indisponibilidade ou limites de uso da API bloqueiam o app no pico                     | Alto    | Média | Tratar erros e timeouts (RNF-04); isolar acesso em `src/services/`; cache com TTL; debounce; plano B (OQ-02) |
| R-02 | Mudança de contrato ou formato da API quebra a aplicação                               | Médio   | Baixa | Tipar respostas; validar payload (RNF-09); testes com fixtures versionadas                                   |
| R-03 | Homônimos e ordenação ruim levam o usuário à cidade errada                             | Médio   | Alta  | Exibir região e país (AC-01.4); critério de relevância (OQ-07); testes de homônimos                          |
| R-04 | Previsão desatualizada gera desconfiança ou decisões erradas                           | Médio   | Média | Exibir horário da última atualização (AC-03.4); política de refresh (OQ-09); aviso de precisão               |
| R-05 | Contraste insuficiente no glassmorphism reprova WCAG 2.1 AA                            | Médio   | Média | Razões mínimas 4,5:1 (texto) e 3:1 (componentes); validar tokens antes do código; auditoria axe no E2E        |
| R-06 | Arredondamento inconsistente na conversão de unidades                                  | Baixo   | Baixa | Converter apenas na apresentação (RN-02); regra definida em OQ-09; cobrir com testes unitários               |
| R-07 | Escopo cresce (mapas, alertas, favoritos, geolocalização) e atrasa a entrega           | Médio   | Alta  | Itens registrados em Out of Scope (seção 9)                                                                  |
| R-08 | Uso comercial sem licença adequada ou sem atribuição exigida pela Open-Meteo           | Alto    | Média | Validar termos (OQ-03); prever plano pago se necessário; atribuição visível (RF-09)                          |
| R-09 | `backdrop-filter` ilegível ou ausente em navegadores antigos                           | Médio   | Média | Suporte às últimas versões (A-10); fallback com fundo sólido (E-20); testar contraste nos navegadores-alvo   |
| R-10 | Testes E2E instáveis por dependerem da API real e consumirem cota no CI                | Médio   | Alta  | E2E com mocks/fixtures; testes contra API real apenas em job separado e opcional                             |
| R-11 | Fuso horário mostra previsão do dia errado perto da meia-noite                         | Médio   | Média | Definir fuso de referência (OQ-08); usar `timezone` retornado pela API (E-15)                                |
| R-12 | Descumprimento da LGPD por falta de política de privacidade ou aviso sobre envio de IP | Alto    | Baixa | Validação jurídica antes do lançamento (OQ-12); nenhum dado salvo localmente (RF-06)                         |
| R-13 | Sem hospedagem, CI/CD e domínio definidos, o app não chega à produção                  | Alto    | Média | Escolher hospedagem estática na fase de Plan (OQ-13); pipeline com lint, build e test                        |
| R-14 | Sem SLO nem monitoramento de erros, falhas passam despercebidas                        | Médio   | Média | Definir SLO (OQ-01); monitorar erros técnicos da API sem telemetria de uso (RNF-05)                          |
| R-15 | Decisões tardias de unidade e idioma geram retrabalho na UI                            | Médio   | Média | Q1, Q2 e Q5 decididas; textos e formatos centralizados (RN-04)                                               |
| R-16 | Geolocalização adicionada depois exige mudar arquitetura e privacidade                 | Alto    | Baixa | Decidida a não oferecer (Q3); mantida em Out of Scope                                                        |

---

## 9. Out of Scope

- Geolocalização do usuário (Q3).
- Histórico de buscas e cidades favoritas (Q4).
- Persistência de preferências entre visitas (Q1).
- Índice UV (Q6).
- Previsão horária (Q7).
- Analytics e telemetria de uso (Q12).
- Autenticação de usuários.
- Interface em idiomas diferentes de pt-BR (Q5).
- App nativo (Q10).
- Mapas e alertas meteorológicos (R-07).
- Backend próprio, cache de servidor ou banco de dados.
- Compartilhamento de previsões em redes sociais.

---

## 10. Open Questions

| ID    | Pergunta                                                                                                                | Impacto                       | Origem         |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------- |
| OQ-01 | Qual é a meta de desempenho (p75 do carregamento em 4G) e de disponibilidade aceitável? **Decidida (provisório):** p75 ≤ 2 s no carregamento em 4G (RNF-02). Disponibilidade alvo ainda aberta. | RNF-02, R-14, O-1             | Q8 (em aberto) |
| OQ-02 | Qual é o plano B caso a Open-Meteo deixe de atender ao uso esperado? Precisa de dono e data.                            | R-01, R-08                    | Q11 (adiada)   |
| OQ-03 | A Open-Meteo permite o uso comercial pretendido? Há necessidade de plano pago e de atribuição específica?                | R-08, A-02, RF-09             | R-08           |
| OQ-04 | **Decidida (provisório):** cache offline apenas da shell do app; nenhum dado meteorológico offline (RNF-08, RN-06).                                     | RNF-08, E-08                  | Q10            |
| OQ-05 | **Decidida (Q6 revisada):** temperatura, sensação térmica, condição/ícone, umidade, vento, precipitação e pressão ficam em RF-03. Índice UV fica fora.        | RF-03, A-11                   | Q6             |
| OQ-06 | **Decidida (provisório):** Chrome, Edge, Firefox e Safari, em suas versões estáveis mais recentes (A-10, RNF-11).                                    | R-09, A-10, RNF-03            | Q9             |
| OQ-07 | Qual é o critério de relevância/ordenação dos resultados de busca? Como tratar homônimos além de exibir região e país?  | E-04, R-03                    | R-03           |
| OQ-08 | Qual fuso de referência usar para datas da previsão: o da cidade pesquisada ou o do usuário?                            | RN-01, E-15, R-11             | R-11           |
| OQ-09 | **Decidida (provisório):** inteiro mais próximo, empate para cima (RN-05); sem cache de dados entre seleções (RN-06).            | RF-05, E-14, R-04, R-06, R-01 | R-04, R-06     |
| OQ-10 | **Decidida (provisório):** mínimo de 2 caracteres, debounce de 300 ms, timeout de 10 s e limite de 100 caracteres.                    | RF-01, E-02, E-11             | Novo           |
| OQ-11 | O público-alvo e as personas foram validados? Qual é a métrica de conclusão aceitável nos testes com usuários?          | O-3, seção 1.4                | Discovery      |
| OQ-12 | Há parecer jurídico sobre LGPD e é necessário aviso sobre envio de IP à Open-Meteo?                                      | R-12, RNF-05                  | R-12           |
| OQ-13 | Qual plataforma de hospedagem estática e qual domínio serão usados?                                                     | R-13, RNF-06                  | R-13           |
| OQ-14 | **Decidida (provisório):** escopo global, sem filtro por país (RN-07). | RF-01, E-04, RN-04 | Novo |
| OQ-15 | **Decidida (provisório):** decimal com `,`, horário de 24 h (`HH:mm`) e data `dd/mm/aaaa` (RN-08). | RN-04, RF-03 | Novo |
| OQ-16 | **Decidida (provisório):** estado vazio com instrução, sem exibir a última cidade da sessão (AC-07.8). | RF-07, RF-06 | Novo |
| OQ-17 | Qual ferramenta de monitoramento de erros técnicos é permitida sem telemetria de uso nem dados pessoais? | R-14, RNF-05 | R-14 |

---

## Histórico de alterações

| Versão | Data       | Alteração                                                |
| ------ | ---------- | -------------------------------------------------------- |
| 0.1    | 2026-11-11 | Primeira versão gerada a partir de `specs/discovery.md`. |
| 0.2    | 2026-11-11 | User Stories reescritas (US-01 a US-09), critérios em Given/When/Then, novos edge cases E-21 a E-25 e critérios AC-01.5 a AC-01.8, AC-03.5, AC-04.4 e AC-07.6. |
| 0.3    | 2026-11-11 | Correção do AC-08.3 (reflow a 400% de zoom), métrica de desempenho unificada (≤ 2 s p75), RF-10 e AC-10.x para mapeamento de `weather_code`, AC-07.7 (429), RNFs ajustados para critérios automatizáveis, detalhes de implementação movidos para o plano, OQ-14 a OQ-16 adicionados. |
| 0.4    | 2026-11-11 | Revisão de precisão: conversão de °F a partir do valor bruto (AC-05.1 corrigido: 76 °F, não 77 °F), métrica O-2 sem telemetria, zoom de 400% em personas e US-06, tabela WMO em RF-10 (AC-10.3), AC-07.8 (condicional a OQ-16), RNF-02 com método de medição, RNF-11 (navegadores), E-22 dividida em E-22/E-26 a E-29, OQ-17. |
| 0.5    | 2026-11-11 | Decisões provisórias aplicadas às OQ-01, OQ-04, OQ-06, OQ-09, OQ-10, OQ-14, OQ-15 e OQ-16: novas RN-05 a RN-08; timeouts, debounce e limites fixados em AC-01.1, AC-01.7, AC-01.8 e AC-07.5; cache offline restrito à shell (RNF-08); AC-07.8 incondicional; OQ-01 mantém disponibilidade em aberto. |
| 0.6    | 2026-11-11 | Matriz de rastreabilidade US → RF → AC → RNF adicionada (seção 3.1). |
