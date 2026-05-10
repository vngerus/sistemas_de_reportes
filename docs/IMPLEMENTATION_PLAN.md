# Plan de implementación — Reporte ejecutivo Palvi

> Documento de trabajo. Se construye por fases. Cada fase tiene criterios DoD y referencias a las skills locales en `.agents/skills/` que conviene leer antes de tocar código.

---

## 1. Lectura del problema

**Usuario:** Jefe de Ventas. **Tiempo:** 5 min antes de su primera reunión. **Objetivo:** salir sabiendo _dónde poner foco hoy_ — no estudiar todas las métricas.

**Implicancia clave:** la app no es un panel de BI. Es un **resumen ejecutivo opinado**. Si presento 11 métricas × 365 días sin priorización, le hago perder los 5 minutos. Si computo qué duele hoy y se lo digo arriba, gano.

**Restricción dura:** los 4 datasets (A, B, C, D) tienen la misma estructura pero **comportamiento distinto**. La app debe responder de manera diferente a cada uno — no basta con renderizar bonito el A y "que los demás también pasen". La lógica de scoring debe producir titulares distintos para cada dataset.

**Lo que se evalúa (PDF):** _"cómo descompusiste el problema, qué abstracciones elegiste y qué decisiones tomaste tú versus la IA"_. Las decisiones pesan más que el feature count.

---

## 2. Decisiones de producto (lo no técnico)

### 2.1 Jerarquía visual — _de arriba hacia abajo_

1. **Selector de dataset (A/B/C/D)** — visible siempre, parte del estado URL.
2. **Headline insights (1–3 frases)** — generadas automáticamente, ordenadas por severidad. Ej: _"Tiempo de respuesta subió 64% esta semana — está tumbando la conversión de leads."_
3. **Funnel snapshot** — tráfico → leads → calificados → deals → ganados, con tasas entre pasos. Permite identificar el cuello.
4. **KPI grid** — las 11 métricas con valor actual, delta vs ventana anterior, sparkline, y un _estado_ (good / watch / bad) que respeta `direction`.
5. **Trend chart con anomalías** — métrica seleccionada (default: la más alarmada), serie completa con bandas y puntos anómalos.

### 2.2 Qué _no_ va a tener

- Filtros por rango de fecha custom. Las ventanas son fijas: hoy, últimos 7d, 7d previos, 30d. Justificación: 5 minutos.
- Tabla con 365 filas. Justificación: 5 minutos.
- Comparación cruzada entre datasets (A vs B en mismo gráfico). Justificación: el PDF dice "navegar entre ellos", no compararlos. Esto va a la sección "segunda iteración".
- Login/auth/multi-tenant. Es un reporte estático de un JSON.

### 2.3 Definición de las ventanas (justificadas)

- **"Hoy":** último día del dataset. La data es histórica fija; "hoy" es el día más reciente disponible.
- **"Esta semana":** últimos 7 días incluyendo "hoy".
- **"Semana anterior":** los 7 días previos a esa.
- **Win rate:** se calcula por ventana, no por cohorte. Definición ya dada en el PDF: `sum(deals_won) / sum(deals_won + deals_lost)` sobre los 7d.
- **Funnel:** sumas de la ventana de 7 días para evitar ruido diario; tasas entre pasos consecutivos.
- **Anomalías:** z-score > 2 contra media móvil de 30 días (ventana móvil simple, no exponencial — más explicable).

### 2.4 Reglas de "dónde poner foco" (scoring por métrica)

Cada métrica recibe un estado calculado:

| Estado    | Regla (respetando `direction`)                                                                 |
| --------- | ---------------------------------------------------------------------------------------------- |
| `bad`     | delta semana vs anterior empeora ≥ 20% **o** valor del último día es anómalo en dirección mala |
| `watch`   | delta empeora 5–20% **o** tendencia de 30d empeora                                             |
| `good`    | delta mejora ≥ 5%                                                                              |
| `neutral` | sin cambio significativo                                                                       |

`direction: lower_is_better` invierte el signo. **Esta es la abstracción central** y va a ser el archivo que muestre en el video walk-through (PDF, sección 3.2).

Headline insights se construyen tomando las top 1–3 métricas en estado `bad`, en orden de severidad. Si no hay `bad`, se reporta el mejor `good`. Si todo es `neutral`, se dice "Sin señales fuertes hoy" — honestidad sobre fanfarria.

---

## 3. Decisiones técnicas

| Tema           | Elección                                                                          | Por qué                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lenguaje       | TypeScript estricto                                                               | Pedido y reduce bugs en la lógica de cálculo                                                                                                     |
| Framework      | React 19 + Vite 8 (ya scaffolded)                                                 | Pedido                                                                                                                                           |
| Styling        | Tailwind v4 (ya scaffolded)                                                       | Sin librería de UI: el PDF valora decisiones, no un look genérico de Material/Chakra                                                             |
| Charting       | **SVG custom para sparklines** + **Recharts para el trend chart principal**       | Recharts se usa solo en el line chart principal; sparklines mantienen SVG custom para mantener tamaño y control visual. Decisión final en Fase 3 |
| Estado         | `useState` + `useReducer` + URL query (`?dataset=A`)                              | No hay multi-vista compleja; Redux/Zustand sería overengineering                                                                                 |
| Routing        | URL search param manejado con `URLSearchParams` + `popstate` (sin `react-router`) | Ahorra ~12KB gz y la nav es un solo segmento                                                                                                     |
| Carga del JSON | Import estático `import metrics from './data/metrics.json'`                       | 668KB → ~150KB gz; aceptable para una SPA con 4 datasets fijos. Si pesa, partir en lazy chunks por dataset                                       |
| Validación     | Type guard manual + `as const` schema (sin Zod)                                   | Es un dataset propio, conocido y estático — Zod sería peso muerto                                                                                |
| Testing        | Vitest solo para `src/lib/aggregations.ts` y `scoring.ts`                         | El valor del testing está en la lógica de cálculo, no en la UI estática                                                                          |
| A11y           | WCAG AA: roles, focus visible, contraste, prefers-reduced-motion                  | Estándar profesional, no negociable                                                                                                              |

### 3.1 Estructura de carpetas

```
src/
  data/metrics.json               # ya existe
  types/
    metrics.ts                    # MetricKey, MetricDef, DayMetrics, Dataset, etc.
  lib/
    dataset-loader.ts             # carga + valida + tipa metrics.json
    aggregations.ts               # KPIs, deltas, funnel, win rate, ventanas
    scoring.ts                    # estado por métrica, headline insights
    anomalies.ts                  # z-score sobre media móvil
    format.ts                     # número, unidad, porcentaje, "+/- N%"
  hooks/
    useDatasetParam.ts            # ?dataset=A|B|C|D, default A
  components/
    DatasetSwitcher.tsx
    HeadlineInsights.tsx
    KpiCard.tsx
    Sparkline.tsx
    Funnel.tsx
    MetricGrid.tsx
    TrendChart.tsx
    StatusBadge.tsx               # good/watch/bad/neutral
    EmptyState.tsx                # cuando una métrica es todo null
  App.tsx
  main.tsx
  index.css
docs/
  IMPLEMENTATION_PLAN.md          # este archivo
  DATASET_NOTES.md                # output de la Fase 0 (ver más abajo)
tests/
  aggregations.test.ts
  scoring.test.ts
  anomalies.test.ts
```

---

## 4. Modelo de datos (tipos)

```ts
// src/types/metrics.ts
export type MetricKey =
  | 'traffic'
  | 'leads_created'
  | 'leads_qualified'
  | 'deals_created'
  | 'deals_won'
  | 'deals_lost'
  | 'avg_response_time_min'
  | 'avg_deal_cycle_days'
  | 'stale_deals'
  | 'support_tickets_opened'
  | 'support_avg_resolution_hours';

export type Direction = 'higher_is_better' | 'lower_is_better';

export interface MetricDef {
  key: MetricKey;
  label: string;
  unit: string;
  direction: Direction;
  description: string;
}

export interface DayPoint {
  date: string; // ISO YYYY-MM-DD
  metrics: Partial<Record<MetricKey, number | null>>;
}

export interface Dataset {
  id: 'A' | 'B' | 'C' | 'D';
  metadata: {
    start_date: string;
    end_date: string;
    days: number;
    metrics: MetricDef[];
  };
  days: DayPoint[];
}
```

Nulls en métricas se respetan en _toda_ la pipeline: agregaciones ignoran `null` (no los tratan como 0), sparklines marcan gap, KPI muestra "—" cuando no hay valor.

---

## 5. Lógica de cálculo — `src/lib/aggregations.ts`

Funciones puras, todas testeables. Trabajan sobre `DayPoint[]`.

| Función          | Firma                                  | Notas                                                   |
| ---------------- | -------------------------------------- | ------------------------------------------------------- |
| `windowOf`       | `(days, n) => DayPoint[]`              | últimos n días (default n=7)                            |
| `previousWindow` | `(days, n) => DayPoint[]`              | n días _antes_ de la ventana actual                     |
| `sumMetric`      | `(days, key) => number \| null`        | ignora null; null si la ventana entera es null          |
| `avgMetric`      | `(days, key) => number \| null`        | promedio ponderado por días con valor                   |
| `latestValue`    | `(days, key) => {value, date} \| null` | último día con valor no-null                            |
| `delta`          | `(curr, prev) => {abs, pct} \| null`   | maneja prev=0 (devuelve `null` o `Infinity` controlado) |
| `winRate`        | `(days) => number \| null`             | `won / (won + lost)` sobre la ventana                   |
| `funnel`         | `(days) => FunnelStep[]`               | con tasa entre pasos consecutivos                       |
| `rollingAvg`     | `(days, key, window) => number[]`      | para anomalías y sparkline suavizado                    |

**Regla:** cualquier función que pueda devolver `null` _debe_ tipar `T | null`, no `T | undefined`. Consistencia para los componentes.

---

## 6. Scoring & headlines — `src/lib/scoring.ts`

Esta es la abstracción central. Sale en el video walk-through.

```ts
export type Status = 'good' | 'watch' | 'bad' | 'neutral';

export interface MetricScore {
  key: MetricKey;
  status: Status;
  severity: number; // 0..1, ordena headlines
  headline: string; // "Tiempo de respuesta subió 64% esta semana"
  reason: string; // explicación corta para tooltip
  current: number | null;
  delta: { abs: number; pct: number } | null;
}

export function scoreMetric(def: MetricDef, days: DayPoint[]): MetricScore;
export function buildHeadlines(scores: MetricScore[], max = 3): MetricScore[];
```

**Reglas anti-falso-positivo:**

- Si la ventana actual o previa tienen < 3 puntos válidos, status = `neutral` con razón "datos insuficientes".
- Si delta% está calculado contra previo = 0, evitar `Infinity` en headline. Mostrar valor absoluto.
- Severidad combina: |delta%| × peso por familia (ventas > soporte > tráfico, _ajustable_).

**Familias de métricas (para mensajes legibles, no para arquitectura):**

- Funnel: traffic, leads_created, leads_qualified, deals_created, deals_won, deals_lost
- Velocidad: avg_response_time_min, avg_deal_cycle_days
- Salud: stale_deals
- Soporte: support_tickets_opened, support_avg_resolution_hours

---

## 7. Componentes UI

### 7.1 Composición (referencia: `.agents/skills/composition-patterns/SKILL.md`)

- **Sin booleanos para variantes.** `<KpiCard status="bad">` ✓, no `<KpiCard isBad isUrgent>`.
- **Children > render props.** `<HeadlineInsights>{scores.map(s => <Headline ...>)}</HeadlineInsights>`.
- **Compound components** para `Funnel`: `<Funnel><Funnel.Step /></Funnel>`.
- **React 19:** preferir `use()` antes que `useContext()` cuando aplique. Sin `forwardRef`.

### 7.2 Performance (referencia: `.agents/skills/react-best-practices/`)

Aplicar selectivamente — la app es pequeña, no premature-optimize:

- `useMemo` solo para los cómputos pesados (scoring de los 4 datasets, anomalías, rolling avgs).
- `key` estable en listas de KPI cards (usar `metric.key`).
- Sparklines: SVG con `viewBox` fijo, paths simplificados (precisión 1 decimal — `rendering-svg-precision`).
- Evitar re-render del grid completo al cambiar dataset: split de hooks (`rerender-split-combined-hooks`).

### 7.3 Estilo (referencia: `.agents/skills/tailwind-css-patterns/SKILL.md` + `frontend-design/SKILL.md`)

- **Aesthetic direction:** ejecutivo serio, dato denso, refinado. Tipografía con personalidad (**no Inter ni system-ui** — `frontend-design/SKILL.md` lo desaconseja explícitamente). Candidatos: _Söhne / IBM Plex Sans_ para body, _Söhne Mono / JetBrains Mono_ para números (números tabulares = `font-variant-numeric: tabular-nums`).
- **Theme:** decidir en Fase 3. Recomendación inicial: dark mode default con acentos calibrados (verde / ámbar / rojo de status, no neón).
- **Spacing:** escala base 4px, generosa para legibilidad rápida.
- **Estados:** los colores de status NUNCA solos — siempre + ícono + texto (a11y, no daltónicos-friendly si es solo color).

### 7.4 A11y mínimo (referencia: `.agents/skills/accessibility/SKILL.md`)

- `<html lang="es">` o `lang="en"` consistente con copy.
- Focus visible en todo (Tailwind `focus-visible:ring-2`).
- `aria-current="page"` en el dataset activo.
- `aria-live="polite"` en headlines al cambiar dataset.
- Sparklines con `<title>` describiendo "métrica X, últimos 7 días, tendencia bajando".
- `prefers-reduced-motion` respetado en cualquier animación.
- Contraste AA (4.5:1) verificado.

---

## 8. Fases

### Fase 0 — Análisis del dataset _(45 min)_

**Objetivo:** entender qué cambia entre A, B, C, D antes de codear nada. Si la app no responde diferente a cada uno, el resto es decoración.

**Tareas:**

1. Script throwaway (Node o navegador) que imprima por dataset:
   - Promedios y desviación de cada métrica.
   - Tendencia general (regresión simple sobre los 365 días).
   - Win rate global.
   - Conversion rates del funnel.
2. Escribir `docs/DATASET_NOTES.md` con 1–2 frases por dataset describiendo "su personalidad" (ej: _"B tiene tráfico estable pero response_time creciendo — bottleneck de soporte/ventas"_). **Esto valida el design de scoring.**

**DoD:** los 4 datasets descritos. Decisión confirmada de qué métricas activar primero en headlines.

**Skills aplicables:** ninguna específica — es análisis exploratorio.

---

### Fase 1 — Foundation _(30 min)_

**Tareas:**

1. Definir `src/types/metrics.ts` (sección 4).
2. `src/lib/dataset-loader.ts`: import del JSON + type guard mínimo (verifica que existan A/B/C/D y que cada uno tenga 365 días).
3. `src/lib/format.ts`: `formatNumber`, `formatUnit`, `formatDelta`, `formatDate`. `Intl.NumberFormat` con locale `'en-US'` (o `'es-CL'`, decidir).
4. `src/hooks/useDatasetParam.ts`: lee/escribe `?dataset=A`, default `A`, suscripción a `popstate`.
5. App.tsx esqueleto: layout vacío con Header + main, sin contenido aún.

**DoD:** typecheck verde, dev server arranca, cambiar `?dataset=B` se refleja en estado.

**Skills aplicables:**

- `.agents/skills/typescript-advanced-types/SKILL.md` — discriminated unions para `Status`, mapped types si aplica.
- `.agents/skills/vite/SKILL.md` — para alias `@/` si se quiere; opcional.

---

### Fase 2 — Lógica de cálculo _(50 min)_

**Tareas:**

1. `src/lib/aggregations.ts` con todas las funciones de la sección 5.
2. `src/lib/anomalies.ts`: rolling mean & std, z-score por punto.
3. `src/lib/scoring.ts`: `scoreMetric` y `buildHeadlines`.
4. Tests Vitest sobre los tres archivos. **Mínimo:**
   - Manejo de nulls en sumas/promedios.
   - Delta con prev=0.
   - winRate con won+lost=0.
   - Score sobre `direction: lower_is_better` invierte el signo.
   - Headlines ordenados por severidad.

**DoD:** `npm test` verde, cobertura razonable de los casos límite. Lógica usable desde la consola del navegador (`window.__debug` opcional).

**Skills aplicables:**

- `.agents/skills/react-best-practices/rules/js-*.md` para perf de iteraciones (combinar filter+map, length-check-first, set/map para lookups). No son críticas con N=365 pero son baratas.

---

### Fase 3 — UI core _(60 min)_

**Tareas (en orden):**

1. `DatasetSwitcher` — segmented control A/B/C/D. Decisión sobre estética definida aquí.
2. `KpiCard` + `Sparkline` (SVG custom) + `StatusBadge`. **Hacer que se vea bien con un solo dataset primero.**
3. `MetricGrid` — 11 cards, mobile-first responsive.
4. `Funnel` — compound. 5 pasos con tasas entre pasos.
5. `HeadlineInsights` — top 3 scores con copy del campo `headline`.
6. `TrendChart` — la métrica más alarmada por default, con dropdown para cambiar. Decisión final Recharts vs custom SVG según peso.

**DoD:** abre `?dataset=A`, layout completo. Cambia a `?dataset=B`, headlines diferentes, KPIs diferentes, funnel diferente.

**Skills aplicables:**

- `.agents/skills/composition-patterns/rules/architecture-compound-components.md` — para `Funnel`.
- `.agents/skills/composition-patterns/rules/architecture-avoid-boolean-props.md` — para `KpiCard`/`StatusBadge`.
- `.agents/skills/tailwind-css-patterns/references/component-patterns.md` — patrones de cards.
- `.agents/skills/frontend-design/SKILL.md` — la dirección estética.

---

### Fase 4 — Polish & a11y _(30 min)_

**Tareas:**

1. Recorrido teclado: Tab debe navegar dataset → métrica → trend dropdown.
2. Focus rings, contrast check (DevTools axe / Lighthouse).
3. Loading state: si `metrics.json` se vuelve lazy, `<Suspense>` con skeleton.
4. Error state: si el JSON falla validación, EmptyState explicativo.
5. `prefers-reduced-motion` en transitions.
6. `<head>` — title descriptivo, meta description, favicon.
7. Smoke test manual con cada dataset.

**DoD:** Lighthouse a11y ≥ 95, sin errores de consola, transitions razonables.

**Skills aplicables:**

- `.agents/skills/accessibility/SKILL.md` y `references/A11Y-PATTERNS.md`.
- `.agents/skills/seo/SKILL.md` para meta tags básicos (no es el foco, pero rápido).

---

### Fase 5 — Entregables _(25 min)_

**Tareas:**

1. **README.md** (1 página, dos secciones — pedido del PDF):
   - **Decisiones técnicas:** sin librería UI, charting custom + Recharts si aplica, scoring centralizado en `lib/scoring.ts`, sin Zod, URL state. Una frase por decisión, qué eligió, por qué.
   - **Segunda iteración:** comparación cruzada entre datasets, drill-down por métrica, alertas configurables, export a PDF/Slack, persistencia de la métrica seleccionada por usuario.
   - Bloque "Cómo correrlo": `npm i && npm run dev`. Eso.
2. Repo en GitHub público o invitar al equipo.
3. **Video ≤ 3min** (toma directa, sin editar — pedido del PDF):
   - 0:00–1:00 — demo: cambia A → B, muestra que headlines y KPIs cambian.
   - 1:00–2:30 — abre `src/lib/scoring.ts`, explica `scoreMetric` y `buildHeadlines`. _Este es el archivo del walk-through._
   - 2:30–3:00 — "lo que dejé fuera": comparación cruzada entre datasets, justificada.

**DoD:** repo URL + README + video subido. Plazo: 5 días corridos desde recepción del task.

---

## 9. Riesgos y mitigaciones

| Riesgo                                                  | Mitigación                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Scoring produce headlines idénticos para los 4 datasets | Fase 0 valida ANTES de codear. Si los datasets no son distinguibles con scoring, ajustar reglas/pesos hasta que lo sean |
| Recharts pesa demasiado para un solo gráfico            | Decisión condicional en Fase 3 — si es solo un line chart, hacer custom SVG con ~40 líneas y eliminar la dep            |
| Tailwind v4 + Vite 8 (toolchain reciente) tiene quirks  | El scaffold ya compila; mantener config mínima y no aventurarse en features beta                                        |
| Tiempo: 3h estimadas, 4h techo                          | Si la Fase 3 se desborda, recortar TrendChart y dejar solo headlines + KPI grid + funnel. Eso ya es entregable          |
| Datos null mal manejados                                | Tests específicos en aggregations + UI muestra "—" en vez de "0" o "NaN"                                                |
| Headlines tipo "Infinity%" cuando previo es 0           | Ya cubierto en regla anti-falso-positivo (sección 6)                                                                    |
| Daltonismo: status solo por color                       | Status badge siempre con ícono + texto, no solo color                                                                   |

---

## 10. Lo que se queda fuera (para README → "Segunda iteración")

- **Comparación cruzada** entre datasets (A vs B en mismo gráfico). Entendido pero no pedido en el PDF — sería "comparar negocios", no "navegar entre ellos".
- **Drill-down por métrica:** vista detalle con descomposición, segmentación.
- **Alertas configurables:** thresholds del usuario, no hard-coded.
- **Export:** PDF/imagen del reporte, link compartible para reuniones.
- **Persistencia:** recordar la métrica seleccionada en `localStorage`.
- **Cohort win rate:** además del win rate por ventana.
- **Tests UI:** Playwright/Testing Library para los componentes — no es ROI alto en 3h.
- **i18n:** copy en español/inglés.
- **Performance budget formal:** bundle analyzer, code-splitting por dataset si pesa.

---

## 11. Checklist final del entregable

- [ ] Repo GitHub público o invitación al equipo Palvi
- [ ] `npm install && npm run dev` arranca sin errores
- [ ] `npm run build` produce un dist sin warnings críticos
- [ ] App responde diferente a A, B, C, D — verificado manualmente
- [ ] README ≤ 1 página, dos secciones (Decisiones técnicas + Segunda iteración)
- [ ] Lighthouse a11y ≥ 95 en `?dataset=A`
- [ ] Sin warnings de React en consola
- [ ] Video ≤ 3 min, toma directa, estructura: demo → walk-through `lib/scoring.ts` → lo que faltó
- [ ] Plazo: dentro de 5 días corridos desde recepción

---

## 12. Mapa de skills locales por fase (referencia rápida)

| Fase | Skills en `.agents/skills/`                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | —                                                                                                                                                     |
| 1    | `typescript-advanced-types`, `vite`                                                                                                                   |
| 2    | `react-best-practices/rules/js-*`                                                                                                                     |
| 3    | `composition-patterns`, `tailwind-css-patterns`, `frontend-design`, `react-best-practices/rules/rerender-*`, `react-best-practices/rules/rendering-*` |
| 4    | `accessibility`, `seo`                                                                                                                                |
| 5    | —                                                                                                                                                     |

`nodejs-backend-patterns` y `nodejs-best-practices` no aplican (no hay backend).

Lo central del plan:

1. Insight de producto, no de UI: lo evaluable es que la app responda diferente a cada dataset (A/B/C/D). Eso
   obliga a centralizar la lógica en src/lib/scoring.ts — que además es el archivo perfecto para el
   walk-through del video (el PDF lo pide explícitamente).
2. Fase 0 antes de codear: un análisis exploratorio de los 4 datasets para verificar que el scoring producirá
   headlines distintos. Si no se diferencian, el resto es decoración.
3. Decisiones técnicas explícitas y argumentadas (lo que pesa en la evaluación según el PDF): sin UI lib,
   charting custom-first, sin Zod, URL state vanilla, sin react-router, sin Redux. Cada una con su "por qué".
4. 6 fases con DoD y tiempos sumando ~4h techo (alineado con el PDF: 3h estimadas, ≤4h).
5. Mapeo de skills locales por fase: cada fase referencia los archivos específicos en .agents/skills/ que
   conviene leer (no las invoca como "skills" del runtime — son referencia documental).
6. Riesgos y "lo que queda fuera" ya redactados para que se copien tal cual al README de la sección "segunda
   iteración" del entregable.

Sugerencia: antes de empezar Fase 1, ejecuta la Fase 0 (45 min) — es el seguro contra el peor riesgo (scoring
que no diferencia datasets). Avísame cuando quieras arrancarla y la armo.
