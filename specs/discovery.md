# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação web de previsão do tempo, acessível por
navegador e otimizada para dispositivos móveis. A aplicação deve permitir
consultar o clima de uma cidade de forma rápida, com dados atuais e
previsão de 5 dias, em unidades configuráveis (Celsius ou Fahrenheit).

Stack definida pelo projeto: React + Vite, TypeScript (strict), Tailwind CSS
(tema dark glassmorphism), Vitest + Testing Library, Playwright, Biome, pnpm.
Fonte de dados: Open-Meteo (geocoding e forecast, sem API key).

### Personas (hipóteses a validar)

As personas abaixo são hipóteses até que o público-alvo seja confirmado
(ver Open Questions).

| Persona | Contexto de uso | Objetivo principal | Métrica de sucesso |
| ------- | --------------- | ------------------ | ------------------ |
| **Ana**, planejadora do dia a dia | Mobile, consulta rápida em pé ou no transporte, rede 4G ou Wi-Fi instável | Saber se vai chover ou fazer frio na cidade pesquisada | Tempo entre abrir o app e ver o clima atual (meta: menos de 3 s em 4G, ver RNF-02) |
| **Carlos**, planejador de viagens e operações | Desktop, no escritório, com várias abas abertas e consultas em sequência | Comparar a previsão de 5 dias de várias cidades | Número de cidades consultadas por sessão e taxa de sessões com 2 ou mais cidades |
| **Marina**, usuária com baixa visão | Mobile com leitor de tela (VoiceOver ou TalkBack) e zoom de 200% ou mais | Ver a temperatura atual e a previsão de amanhã sem ajuda | Taxa de conclusão da tarefa "ver o clima atual" sem ajuda em testes com usuários (ver RNF-01 e RNF-03) |

## Requisitos Funcionais

- **RF-01** Buscar cidades por nome (campo de texto com sugestões/resultados).
- **RF-02** Selecionar uma cidade a partir dos resultados da busca.
- **RF-03** Exibir o clima atual da cidade selecionada (temperatura, sensação
  térmica, condição/ícone).
- **RF-04** Exibir a previsão para os próximos 5 dias (máx./mín. e condição por dia).
- **RF-05** Alternar a unidade de temperatura entre Celsius e Fahrenheit,
  aplicando a mudança em todos os valores exibidos.
- **RF-06** Não persistir preferências: a unidade volta ao padrão (Celsius) a
  cada visita (Q1).
- **RF-07** Tratar estados de loading, erro e vazio (busca sem resultados,
  falha de API, cidade sem dados).
- **RF-08** Funcionar em dispositivos móveis com layout responsivo.

## Requisitos Não-Funcionais

- **RNF-01 Responsividade:** layout utilizável em telas a partir de 320 px de
  largura, sem scroll horizontal.
- **RNF-02 Desempenho:** resultados de busca e clima exibidos em até 2 s
  em conexão 4G típica (meta a confirmar).
- **RNF-03 Acessibilidade:** conformidade com WCAG 2.1 AA; campos com labels,
  elementos navegáveis por teclado, foco visível, contraste adequado no tema
  dark glassmorphism.
- **RNF-04 Confiabilidade:** falhas da API Open-Meteo devem ser apresentadas
  com mensagem amigável e opção de tentar novamente.
- **RNF-05 Privacidade:** não solicitar geolocalização, não coletar dados
  pessoais e não usar telemetria de uso (Q3, Q12).
- **RNF-06 Qualidade:** cobertura de testes unitários e E2E dos critérios de
  aceite; `pnpm lint`, `pnpm build` e `pnpm test` passando.
- **RNF-07 Idioma:** interface em pt-BR.
- **RNF-08 Instalabilidade (PWA):** a aplicação deve ser instalável no
  dispositivo, com manifest e service worker (Q10). O escopo de cache offline
  ainda não foi definido.

## Riscos

| ID   | Risco | Impacto | Probabilidade | Mitigação |
| ---- | ----- | ------- | ------------- | --------- |
| R-01 | Indisponibilidade ou limites de uso da API Open-Meteo bloqueiam o app no pico | Alto | Média | Tratar erros e timeouts; isolar acesso em `src/services/`; cache com TTL; debounce na busca; plano B de provedor a definir (Q11, adiada) |
| R-02 | Mudança de contrato ou formato da API sem aviso quebra a aplicação | Médio | Baixa | Tipar respostas em `src/types/`; validar payload em `src/services/`; testes com fixtures versionadas |
| R-03 | Homônimos e ordenação ruim levam o usuário à cidade errada | Médio | Alta | Exibir país/estado junto ao nome; definir critério de relevância; testes com casos de homônimos |
| R-04 | Previsão imprecisa ou desatualizada gera desconfiança ou decisões erradas | Médio | Média | Exibir horário da última atualização; definir política de refresh; aviso sobre precisão da previsão |
| R-05 | Contraste insuficiente no tema glassmorphism reprova WCAG 2.1 AA | Médio | Média | Definir razão mínima (4,5:1 texto, 3:1 componentes); validar tokens de cor antes do código; testes de a11y no E2E |
| R-06 | Arredondamento inconsistente na conversão de unidades | Baixo | Baixa | Converter apenas na apresentação; definir regra de arredondamento e cobri-la com testes unitários |
| R-07 | Escopo cresce (mapas, alertas, favoritos, geolocalização) e atrasa a entrega | Médio | Alta | Registrar itens na seção "Fora de escopo" (Q3, Q4 e Q6 decididas) |
| R-08 | Uso comercial sem licença adequada ou sem atribuição exigida pela Open-Meteo | Alto | Média | Validar termos de uso antes da Spec; prever plano pago se necessário; exibir crédito ao provedor na interface |
| R-09 | `backdrop-filter` do glassmorphism ilegível ou ausente em navegadores antigos | Médio | Média | Suportar as últimas versões dos navegadores principais (Q9); fallback com fundo sólido; testar contraste nos navegadores-alvo |
| R-10 | Testes E2E instáveis por dependerem da API real e consumirem cota no CI | Médio | Alta | E2E com mocks/fixtures; testes contra API real apenas em job separado e opcional |
| R-11 | Erro de fuso horário mostra a previsão do dia errado perto da meia-noite | Médio | Média | Definir fuso de referência (cidade ou usuário); usar o `timezone` retornado pela API nas datas |
| R-12 | Descumprimento da LGPD por falta de política de privacidade ou aviso de armazenamento local | Alto | Baixa | Validar com jurídico antes do lançamento; documentar que nenhum dado é salvo localmente (Q1); avaliar aviso sobre envio de IP à Open-Meteo |
| R-13 | Sem hospedagem, CI/CD e domínio definidos, o app não chega à produção | Alto | Média | Escolher plataforma de hospedagem estática na fase de Plan; pipeline com `pnpm lint`, `pnpm build` e `pnpm test` |
| R-14 | Sem SLO nem monitoramento de erros, falhas passam despercebidas | Médio | Média | Definir SLO (Q8); monitorar erros da API sem telemetria de uso (Q12); alerta sobre taxa de falhas da API |
| R-15 | Decisões tardias de unidade e idioma geram retrabalho em toda a UI | Médio | Média | Q1, Q2 e Q5 decididas; centralizar textos e formatos em módulo de i18n desde o início |
| R-16 | Geolocalização adicionada depois exige mudar arquitetura e privacidade | Alto | Baixa | Q3 decidida (não oferecer); manter em "Fora de escopo" |

## Perguntas em Aberto (Open Questions)

Status: **Decidida** (decisão registrada), **Adiada** ou **Em aberto**.

1. A preferência de unidade deve ser persistida ou volta ao padrão a cada visita?
   **Decidida:** volta ao padrão (Celsius) a cada visita. Nada é salvo localmente.
2. Qual é o padrão inicial de unidade: Celsius ou Fahrenheit?
   **Decidida:** Celsius.
3. A aplicação deve oferecer geolocalização?
   **Decidida:** não oferecer.
4. Haverá histórico de buscas ou cidades favoritas?
   **Decidida:** não.
5. Qual idioma(s) deve ter a interface?
   **Decidida:** pt-BR.
6. Quais métricas exibir além de temperatura?
   **Decidida (Q6 revisada):** temperatura, sensação térmica, condição/ícone, umidade, vento, precipitação e pressão. Apenas o índice UV fica fora (ver RF-03).
7. A previsão é resumo diário ou granularidade por hora?
   **Decidida:** diária.
8. Qual é a meta de desempenho e de disponibilidade aceitável?
   **Em aberto.** RNF-02, R-14 e a meta de disponibilidade dependem desta resposta.
9. Quais navegadores são suportados?
   **Decidida:** última versão dos navegadores principais.
10. Haverá versão nativa (app) ou apenas web?
    **Decidida:** apenas PWA (RNF-08).
11. Qual é o plano caso a Open-Meteo deixe de atender ao uso esperado?
    **Adiada:** a definir no futuro. R-01 e R-08 seguem abertos e precisam de dono e data.
12. Há requisitos de analytics ou telemetria?
    **Decidida:** não.

## Suposições (Assumptions)

- A aplicação será web (SPA) com layout responsivo, instalável como PWA; não haverá app nativo nesta entrega.
- A Open-Meteo não exige API key. A adequação de volume e licença segue pendente (R-08).
- Os dados da API são usados apenas para exibição, sem armazenamento no servidor.
- Não há backend próprio: toda a lógica roda no cliente.
- A previsão é de 5 dias a partir do dia atual, com dados diários (máx./mín.).
- Conversão Celsius ↔ Fahrenheit é feita na apresentação, a partir do valor em Celsius retornado pela API.
- Não há autenticação de usuários.
- Idioma padrão da interface: pt-BR.

## Decisões

Decisões fechadas para destravar a especificação. Cada uma responde ou
restringe as Open Questions indicadas.

| Decisão | Justificativa | Open Questions |
| ------- | ------------- | -------------- |
| **Fonte de dados:** Open-Meteo, sem API key | Não exige chave nem backend próprio, o que é coerente com a arquitetura 100% cliente. Os termos de uso ainda precisam ser validados (R-08). | Escolha do provedor fechada. O plano B da Q11 segue adiado. |
| **"5 dias" = hoje + 4 dias** | Conta o dia atual como dia 1, o que resolve a ambiguidade da premissa "a partir do dia atual" e mantém o contrato de dados diários. | Nenhuma Open Question específica. Resolve a ambiguidade das premissas (seção Suposições). |
| **Unidade padrão: Celsius** | A API retorna em Celsius e a conversão é feita na apresentação (premissa de conversão). Celsius evita conversão na primeira visita. | Q2 resolvida. Q1 resolvida: a unidade volta ao padrão a cada visita. |
| **Sem autenticação e sem persistência de servidor** | Alinha com as premissas "Não há autenticação de usuários" e "sem armazenamento no servidor". Não há backend para guardar estado. | Q4 resolvida: sem histórico ou favoritos. Nenhuma preferência é salva localmente (Q1). |
| **Idioma da UI: pt-BR** | Confirma RNF-07 e a premissa de idioma padrão. Interpretado como pt-BR apenas nesta entrega, sem en-US. | Q5 resolvida. |
| **Métricas: temperatura e métricas básicas** | Revisada pelo usuário: umidade, vento, precipitação e pressão entram em RF-03 junto com temperatura, sensação e condição. Índice UV fica fora. | Q6 revisada. |
| **Geolocalização: não oferecer** | Elimina a permissão do navegador e a superfície de privacidade (RNF-05). | Q3 resolvida. R-16 fica registrada como fora de escopo. |
| **Histórico e favoritos: não** | Mantém a aplicação sem estado do usuário. | Q4 resolvida. |
| **Previsão diária** | Confirma a premissa de dados diários e o RF-04. | Q7 resolvida. |
| **Navegadores: última versão** | Simplifica o suporte e o fallback de `backdrop-filter`. Interpretado como última versão dos navegadores principais (confirmar). | Q9 resolvida. R-09 reduzido. |
| **Plataforma: apenas PWA** | Entrega web instalável, com manifest e service worker (RNF-08). | Q10 resolvida. Escopo de cache offline pendente. |
| **Plano B da API: adiado** | Decisão explícita de adiar. R-01 e R-08 seguem abertos. | Q11 adiada. Precisa de dono e data. |
| **Analytics: não** | Sem telemetria de uso. Monitoramento limitado a erros técnicos (R-14). | Q12 resolvida. |

### Impacto sobre RF-06

Com a decisão da Q1, RF-06 passa a definir que a unidade volta ao padrão a
cada visita. Nenhum dado é salvo no navegador, então a troca de unidade vale
apenas para a sessão atual.

## Fora de escopo

- Geolocalização do usuário (Q3)
- Histórico de buscas e cidades favoritas (Q4)
- Persistência de preferências entre visitas (Q1)
- Índice UV (Q6)
- Previsão horária (Q7)
- Analytics e telemetria de uso (Q12)
- Autenticação de usuários
- Interface em idiomas diferentes de pt-BR (Q5)
- App nativo (Q10)
- Mapas e alertas meteorológicos (R-07)

