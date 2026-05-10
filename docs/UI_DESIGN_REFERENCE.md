# Referencia de UI — Reporte ejecutivo Palvi

> Documento complementario a `IMPLEMENTATION_PLAN.md`. Reinterpreta el prototipo de `docs/ui-idea/` para que cumpla **al 100%** con `task.pdf` y con las decisiones técnicas ya cerradas. No reemplaza al plan: lo aterriza al pixel.
>
> **Cómo usarlo:** antes de tocar cualquier componente en Fase 3, abrí esta referencia. Cada sección dice qué del prototipo se queda, qué se ajusta y qué se descarta — con la razón conectada al PDF (5 minutos, 4 datasets distinguibles, decisiones argumentadas).

---

## 0. Lectura crítica del prototipo `docs/ui-idea/`

El prototipo es un buen punto de partida visual, pero tiene **siete divergencias** respecto del plan que hay que corregir antes de adoptarlo:

| #   | Problema en `docs/ui-idea/`                                                  | Origen                                   | Acción                                                                                      |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | `'use client'` en `dashboard.tsx` y `Sparkline.tsx`                          | Convención Next.js                       | Eliminar — el plan usa Vite, no Next                                                        |
| 2   | `import { ... } from 'lucide-react'`                                         | Dep extra (~18KB gz tree-shaken parcial) | Reemplazar con SVG inline para los 4–5 íconos que se usan                                   |
| 3   | `recharts` en `TrendChart.tsx`                                               | ~90KB gz                                 | Decisión de Fase 3: usar Recharts para el TrendChart principal y SVG custom para sparklines |
| 4   | `import { cn } from '@/lib/utils'`                                           | Helper genérico                          | Crear `lib/cn.ts` mínimo (`clsx` o 8 líneas a mano) — no instalar `tailwind-merge`          |
| 5   | Jerarquía: `WinRate → Headlines → Funnel → Chart+Summary → KPI Grid`         | Diseño exploratorio                      | Reordenar a `Headlines → Funnel → KPI Grid → TrendChart` (ver §2)                           |
| 6   | `KpiCard` extrae label de `headline.split(':')[0]`                           | Acoplamiento frágil                      | El score expone `label` explícitamente; nada de parsear strings                             |
| 7   | "Period Summary" duplica info ya visible (días, métricas, conteos de status) | Relleno visual                           | Eliminar la card. El espacio queda para el TrendChart                                       |

Estas correcciones son **decisiones a defender en el video** (PDF, sección 3.2): "para el TrendChart principal usé Recharts porque hace el componente más sostenible, y mantuve SVG custom en los sparklines ligeros".

---

## 1. Principios rectores de la UI

Antes de cualquier decisión visual, los cuatro principios que filtran cada elección:

1. **Veredicto antes de datos.** El Jefe de Ventas tiene 5 minutos. La UI le dice _qué hacer hoy_ en los primeros 1.5 segundos de scroll, no le pide que interprete 11 sparklines.
2. **Cada dataset se siente distinto.** Si abrís A y B y los headlines, el orden del KPI grid y el color dominante no cambian, la UI falló — aunque los números cambien.
3. **Honestidad sobre fanfarria.** Si no hay señales fuertes, decirlo con copy ("Sin alertas hoy"), no llenar el espacio con métricas neutrales en verde.
4. **Densidad legible.** Un panel ejecutivo no es un sticker: tipografía con personalidad, números tabulares, jerarquía clara. Pero tampoco un BI tool: nada de filtros, sliders ni date pickers.

---

## 2. Jerarquía visual definitiva (top → bottom)

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER · sticky                                              │
│  ┌──────────────────┐                  ┌──────────────────┐  │
│  │ Sales Executive  │                  │  A   B   C   D   │  │
│  │ 26 Apr 25 — …    │                  └──────────────────┘  │
│  └──────────────────┘                                          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  HEADLINES (1–3)         ← lo más importante. aria-live.       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│   1. Tiempo de respuesta subió 64% esta semana — está          │
│      tumbando la conversión de leads.    [ATENCIÓN]            │
│   2. Win rate cayó a 22% (vs 38% semana previa).  [ATENCIÓN]   │
│   3. Tickets resueltos 3x más rápido que el mes pasado. [BIEN] │
│                                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                                │
│  FUNNEL (7d)             Tráfico → Leads → Calif. → Deals → W  │
│  ─── ─── ─── ─── ───   Con tasa entre pasos consecutivos.    │
│                                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                                │
│  KPI GRID  (agrupado)                                          │
│   Sales pipeline  · 6 cards (2 cols mobile, 6 cols desktop)    │
│   Sales velocity  · 2 cards                                    │
│   Health/Support  · 3 cards                                    │
│  Cada card: status dot · label · valor + delta% · sparkline   │
│                                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                                │
│  TREND CHART (la métrica más alarmada por default)             │
│   <select> para cambiar · línea + media móvil · puntos          │
│   anómalos resaltados · empty state si todo null               │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Por qué este orden:**

- **Headlines arriba** porque el PDF dice "salir sabiendo dónde poner foco hoy". Eso es lo único que el usuario _necesita_ ver si solo tiene 30 segundos.
- **Funnel segundo** porque es la métrica de _diagnóstico_ — si los headlines dicen "leads cayendo", el funnel muestra _en qué paso_ se rompe.
- **KPI grid tercero** porque es el detalle: "ya entendí qué duele, ahora muéstrame todos los números".
- **TrendChart al final** porque es exploratorio. El usuario que llegó hasta acá ya tiene los 5 minutos invertidos y quiere profundizar en _una_ métrica específica.

El "Win rate gigante" del prototipo se incorpora **dentro del Funnel** (último paso = ganados, con la tasa al lado), no como banner independiente. Así no compite con los headlines por jerarquía.

---

## 3. Sistema visual

### 3.1 Tipografía

| Uso                       | Familia                             | Notas                                        |
| ------------------------- | ----------------------------------- | -------------------------------------------- |
| Display / títulos         | **Söhne** o **Geist** (fallback)    | Personalidad sin gritar                      |
| Body                      | **IBM Plex Sans**                   | Legible en densidades altas                  |
| Números (KPI, sparklines) | **JetBrains Mono** o **Geist Mono** | `font-variant-numeric: tabular-nums` siempre |

Self-host con `@fontsource-variable/...` o vía link en `<head>`. **Prohibido Inter/Roboto/system-ui** — `frontend-design/SKILL.md` lo veta explícitamente.

### 3.2 Color (dark mode default)

Variables CSS en `index.css`. Los nombres no son negociables — los componentes los referencian.

```css
:root {
  /* Surface */
  --background: #0a0a0b;
  --card: #131316;
  --border: #232328;
  --foreground: #f5f5f7;
  --muted-foreground: #8b8b94;

  /* Status — calibrados, NO neón */
  --status-good: #4ade80;
  --status-good-bg: #14241a;
  --status-watch: #f59e0b;
  --status-watch-bg: #2a1f0a;
  --status-bad: #ef4444;
  --status-bad-bg: #2a1010;
  --status-neutral: #6b7280;
  --status-neutral-bg: #1a1a1f;

  /* Chart */
  --chart-1: #60a5fa;
  --chart-grid: #1f1f24;
}

@media (prefers-color-scheme: light) {
  /* opcional, fase 4 */
}
```

**Regla anti-daltonismo:** el color nunca va solo. Status siempre se acompaña de **ícono + texto** (ya cubierto en `StatusBadge`). Sparklines distinguen estado por color **y** por grosor (1.5px stroke base, 2px en `bad`).

### 3.3 Espaciado y densidad

- Escala base **4px**. Padding interno de cards: `p-4` (16px). Gap entre cards: `gap-3` (12px). Secciones del grid: `space-y-6` (24px).
- Mobile-first: 2 columnas en móvil, 3 en tablet, 6 en desktop para el bloque "Sales pipeline".
- Header sticky con backdrop-filter — el dataset switcher y el rango de fecha siempre visibles al hacer scroll.

### 3.4 Motion

- **Una sola animación de carga** orquestada al cambiar dataset: stagger 30ms entre headlines, 60ms entre filas del KPI grid. Total ≤ 400ms.
- `prefers-reduced-motion: reduce` deshabilita stagger y deja transición lineal de 120ms.
- Hover en KpiCard: solo cambio de `border-color`. **No** scale, **no** shadow growth.

---

## 4. Ajustes por componente

Cada subsección dice: **qué se queda · qué cambia · qué se borra** del archivo en `docs/ui-idea/`. Si no se menciona, es que se mantiene.

### 4.1 `DatasetSwitcher.tsx`

- ✓ **Se queda:** segmented control con `role="tablist"`, `aria-current="page"`, focus ring.
- ✎ **Cambia:** label `Dataset {id}` → solo `{id}` en una tipografía display más grande. Texto auxiliar `Dataset` como `<span class="sr-only">` para a11y. Ahorra ancho en mobile.
- ✎ **Cambia:** keyboard nav con `←/→` además de Tab. `aria-keyshortcuts="ArrowLeft ArrowRight"`.
- ✗ **Borra:** nada.

### 4.2 `HeadlineInsights.tsx`

- ✓ **Se queda:** `aria-live="polite" aria-atomic="true"`, ícono distinto cuando hay `bad`, copy explicativo en cada item.
- ✎ **Cambia:** título de sección dinámico:
  - Si hay ≥1 `bad`: **"Necesita tu atención"**
  - Si todo es `good`/`watch`: **"Lo destacable hoy"**
  - Si todo es `neutral`: **"Sin señales fuertes hoy"** (un solo item, copy honesto — clave para el dataset que sea "aburrido")
- ✎ **Cambia:** el número `1/2/3` a la izquierda se reemplaza por un badge con la letra del dataset (`A`, `B`, `C`, `D`) en la primera card y solo el número en las siguientes. Refuerza visualmente "estoy mirando dataset X".
- ✎ **Cambia:** `headline` debe terminar en `.` (frase completa, no fragmento). `reason` en oración secundaria — _por qué_ es severo, no _qué_ pasó.
- ✗ **Borra:** el `StatusBadge` de la derecha (redundante con el color de fondo). Reemplazar por la **delta% en mono grande**, que es lo que el ejecutivo realmente busca escanear.

### 4.3 `Funnel.tsx`

- ✓ **Se queda:** layout horizontal con tasas entre pasos en desktop, vertical (`FunnelCompact`) en mobile.
- ✎ **Cambia:** convertir a **compound component** (lo pide el plan §7.1):
  ```tsx
  <Funnel data={steps}>
    <Funnel.Step name="traffic" />
    <Funnel.Step name="leads_created" />
    <Funnel.Connector /> // ← muestra la tasa, no una flecha decorativa ...
  </Funnel>
  ```
  En la práctica, el componente público sigue aceptando `steps` y mapea internamente — el shape compound es para el video walk-through (decisión arquitectónica defendible).
- ✎ **Cambia:** la tasa de conversión entre pasos pasa al **conector** (entre barras), no debajo de cada paso. Visualmente más claro.
- ✎ **Cambia:** color de la barra ya no es `bg-chart-1` hardcoded — se calcula del último paso (deals_won): si la tasa total tráfico→won empeoró >20% vs ventana previa, color de la barra = `--status-watch`. Esto **vincula el funnel al scoring** y es lo que hace que cada dataset se vea distinto.
- ✎ **Cambia:** título `Sales Funnel (7 days)` → `Embudo · últimos 7 días` (consistencia idioma con headlines).
- ✗ **Borra:** la versión `FunnelCompact` exportada por separado se integra como branch interna por breakpoint. Una sola API pública.

### 4.4 `KpiCard.tsx`

- ✓ **Se queda:** layout (status dot · label · valor · delta · sparkline), tooltip on hover con `reason`.
- ✎ **Cambia:** **eliminar** `score.headline.split(':')[0]`. El score expone `label: string` (viene de `MetricDef.label`).
- ✎ **Cambia:** delta% formato compacto: `+12%`, `-64%`, `—`. Sin decimales salvo |delta| < 10. Color del delta sigue regla `direction`-aware (ya implementada — mantener).
- ✎ **Cambia:** sparkline de **7 días** (no 14). Razón: el score compara ventana 7d vs 7d previos, el sparkline debe mostrar la _ventana actual_ en la que se basó el veredicto.
- ✎ **Cambia:** cuando `score.current === null`, mostrar `—` con `aria-label="sin datos"`. Sparkline → componente `<EmptyState size="sm">`.
- ✎ **Cambia:** `aria-describedby` apunta al tooltip. El tooltip debe ser navegable con teclado (focus en la card lo abre, Esc lo cierra).
- ✗ **Borra:** el `group-hover` del tooltip se acompaña de `group-focus-within` para que sea accesible.

### 4.5 `Sparkline.tsx`

- ✓ **Se queda:** SVG puro, viewBox fijo, padding 2px, manejo de < 2 puntos.
- ✎ **Cambia:** **gaps en null**. El prototipo construye un solo path saltando nulls — visualmente conecta puntos no consecutivos como si fueran adyacentes. Solución: dividir en sub-paths cuando aparece un null y dibujar cada segmento por separado. Documentar la decisión en el video (es un caso típico del PDF: "algunas métricas pueden venir como null").
- ✎ **Cambia:** precisión de coordenadas a 1 decimal (ya está) — referencia: `react-best-practices/rules/rendering-svg-precision.md`.
- ✎ **Cambia:** `<title>` accesible adentro del `<svg>`: _"Tendencia de {label}, últimos 7 días, {direction de la tendencia}"_. Calculado en el componente padre (KpiCard) y pasado como prop.
- ✗ **Borra:** `'use client'`.

### 4.6 `TrendChart.tsx`

- ✓ **Se queda:** dropdown de métricas, default a la más alarmada, descripción de la métrica, línea de promedio, tooltip con anomalía.
- ✎ **Cambia:** **fuera Recharts**. Implementación SVG custom (~120 líneas):
  - `<svg viewBox="0 0 800 240">` responsive con `preserveAspectRatio="none"` y wrapper con `aspect-ratio: 800/240`.
  - Eje X con 5 ticks distribuidos (`preserveStartEnd` mental model). Eje Y con 4 ticks usando `niceScale()`.
  - Línea principal como `<path>` con sub-paths para nulls (igual que sparkline).
  - Puntos anómalos como `<circle>` separados, `r=3`, color `--status-bad`.
  - Tooltip con `<foreignObject>` o div absoluto controlado por estado, posición calculada en mousemove.
- ✎ **Cambia:** banda de ±2σ alrededor de la media móvil 30d como `<path fill-opacity="0.08">`. Hace que las anomalías se _expliquen visualmente_, no solo aparezcan como puntos rojos sin contexto.
- ✎ **Cambia:** título incluye el _veredicto_: `{label} · {status badge}`. Refuerza por qué esta métrica está seleccionada.
- ✗ **Borra:** import de `recharts`. Eliminar la dep del `package.json` cuando se haga el switch.

### 4.7 `StatusBadge.tsx`

- ✓ **Se queda:** todo. Es el único componente que el prototipo dejó en el estado correcto (variantes explícitas, ícono + texto, sin booleans).
- ✎ **Cambia:** labels en español para consistencia: `Bien` / `Vigilar` / `Atención` / `Estable`. (El `headline` del score ya es en español o puede serlo.)

### 4.8 `MetricGrid.tsx`

- ✓ **Se queda:** agrupación en 3 secciones (Sales pipeline, Sales velocity, Support).
- ✎ **Cambia:** dentro de cada sección, ordenar las cards por `severity desc`. Las que están en `bad` van primero. **Esto refuerza que cada dataset se ve distinto** — el orden cambia con los datos.
- ✎ **Cambia:** "Sales velocity" incluye `stale_deals` (no va en una sección "Health" propia que tendría 1 sola card).
- ✎ **Cambia:** títulos de sección con un contador discreto: `Sales pipeline · 6 métricas · 2 en atención`. Doble función: navegación + reinforcement del veredicto.
- ✗ **Borra:** nada.

### 4.9 `dashboard.tsx`

- ✓ **Se queda:** `useMemo` para scoring, headlines, funnel, winRate; layout con header sticky.
- ✎ **Cambia:** orden de secciones según §2 (Headlines → Funnel → KPI Grid → TrendChart).
- ✎ **Cambia:** `formatDateRange` en español: `26 abr 2025 — 25 abr 2026`.
- ✗ **Borra:**
  - Banner del Win Rate gigante (se integra en el Funnel).
  - Card "Period Summary" (info redundante).
  - `'use client'`.
  - Footer con "Data refreshed from static dataset…" — ya está implícito; agrega ruido visual.

---

## 5. Estados de carga, vacío y error

| Estado      | Cuándo                                                               | UI                                                                                                                                   |
| ----------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Loading     | Solo si en Fase 4 se hace lazy-load del JSON por dataset             | `<Suspense>` con skeleton: 3 barras grises para headlines, grid de 11 rectángulos para KPIs. Sin spinners.                           |
| Empty       | Métrica con todos los días en `null`                                 | KpiCard renderiza `—` en valor, sparkline → `<EmptyState size="sm">Sin datos</EmptyState>`, status `neutral`.                        |
| Empty trend | Métrica seleccionada en TrendChart sin datos suficientes (<3 puntos) | Mantener el chrome (header, dropdown), reemplazar área del chart por `<EmptyState>Datos insuficientes para tendencia.</EmptyState>`. |
| Error       | Fallo de validación del JSON al arrancar                             | `<EmptyState>` full-page con instrucciones: "El dataset no se pudo validar. Reportar al equipo." + raw error.                        |

`EmptyState` es **un componente**, con props `size: 'sm' \| 'md' \| 'lg'` y children opcional. No es un patrón ad-hoc por sitio.

---

## 6. Microcopy (lo que dice la UI)

Todo el copy escrito en español neutro, segunda persona implícita (se evita "tú/usted"). Ejemplos canónicos para que las funciones de scoring los emitan consistentes:

| Situación                                         | Plantilla                                                               |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Métrica `lower_is_better` empeoró ≥ 20%           | `{label} subió {pct}% esta semana — {familia_consequence}.`             |
| Métrica `higher_is_better` empeoró ≥ 20%          | `{label} cayó {pct}% esta semana — {familia_consequence}.`              |
| Métrica `higher_is_better` mejoró ≥ 5%            | `{label} subió {pct}% — la mejor señal de la semana.`                   |
| Sin cambio significativo                          | `{label} estable.`                                                      |
| Datos insuficientes                               | `{label}: no hay suficientes datos en la ventana.`                      |
| Win rate cero pero deals_won > 0 (división por 0) | `Win rate: {value}% sobre {n} deals cerrados.` (mostrar absoluto, no %) |

`familia_consequence` es la oración que liga la métrica al impacto de negocio:

- **traffic** → "menos prospectos llegando al funnel"
- **leads_created/qualified** → "menos oportunidades para el equipo"
- **avg_response_time_min** → "está tumbando la conversión de leads"
- **stale_deals** → "deals quedándose abiertos sin avanzar"
- **support_avg_resolution_hours** → "tickets demorando más en resolverse"

Este mapping vive en `lib/scoring.ts` junto a `scoreMetric`. Es **el archivo del walk-through** del video. Tener acá las plantillas hace que el repaso sea de 90s exactos.

---

## 7. Validación visual por dataset (test de los 5 minutos)

Antes de declarar la UI lista, pasar este checklist con A/B/C/D:

- [ ] Los **3 primeros headlines** son distintos entre A y B (mínimo 2 de 3 cambiados).
- [ ] El **orden del KPI grid** dentro de "Sales pipeline" cambia entre datasets.
- [ ] El **color del funnel** (verde/ámbar/rojo del último paso) cambia al menos en 1 de los 4.
- [ ] La **métrica seleccionada por default en TrendChart** cambia entre datasets.
- [ ] El **conteo "X en atención"** en los títulos de sección es distinto entre datasets.
- [ ] Si algún dataset tiene un día con `avg_response_time_min: null`, la sparkline correspondiente muestra **un gap visible** (no una línea recta atravesando el null).
- [ ] El header `aria-live` anuncia el cambio cuando el usuario alterna A→B con teclado.

Si cualquiera de estos falla en algún dataset, **no es un problema de UI** — es señal de que el scoring no está discriminando. Volver a §6 del plan, no a este doc.

---

## 8. Lo que NO va en la UI (defendible en el video)

Repetimos lo del plan §2.2 con la perspectiva visual:

- **Filtros de fecha custom** — un date picker rompe el contrato de 5 minutos.
- **Tabla con 365 filas** — el TrendChart cubre la curiosidad histórica.
- **Vista A vs B en mismo gráfico** — es "comparar negocios", el PDF pide "navegar entre ellos".
- **Modo claro/oscuro toggle** — dark default, suficiente para v1. Light mode queda en "segunda iteración".
- **Animaciones decorativas** — solo el stagger funcional al cambiar dataset.
- **Iconos para cada métrica individual** — el status dot es el único marcador visual; agregar 11 iconos distintos diluye la jerarquía.
- **Export PDF / share link / dashboards guardados** — segunda iteración, README.

---

## 9. Mapping skill → componente

| Componente         | Skill principal                                               | Skill secundaria                                                 |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `DatasetSwitcher`  | `accessibility/A11Y-PATTERNS.md` (tablist)                    | `composition-patterns/architecture-avoid-boolean-props`          |
| `HeadlineInsights` | `accessibility/SKILL.md` (aria-live)                          | `tailwind-css-patterns/component-patterns`                       |
| `Funnel`           | `composition-patterns/architecture-compound-components`       | `composition-patterns/patterns-children-over-render-props`       |
| `KpiCard`          | `composition-patterns/patterns-explicit-variants`             | `react-best-practices/rerender-memo` (memoizar con `metric.key`) |
| `Sparkline`        | `react-best-practices/rendering-svg-precision`                | `react-best-practices/rerender-simple-expression-in-memo`        |
| `TrendChart`       | `react-best-practices/bundle-conditional` (no Recharts)       | `react-best-practices/rerender-split-combined-hooks`             |
| `StatusBadge`      | `composition-patterns/patterns-explicit-variants` (ya cumple) | —                                                                |
| `MetricGrid`       | `tailwind-css-patterns/responsive-design`                     | `react-best-practices/js-tosorted-immutable` (ordenar por sev.)  |
| `dashboard.tsx`    | `frontend-design/SKILL.md` (jerarquía, tipografía)            | `seo/SKILL.md` (`<title>`, meta description)                     |

Estos no se invocan como skills del runtime — son **lectura previa obligada** del archivo `.md` correspondiente antes de tocar el componente. Si una decisión en el código contradice un skill, hay que poder explicar por qué en el video.

---

## 10. Checklist final de UI (antes de grabar el video)

- [ ] Sin imports de `recharts`, `lucide-react`, `tailwind-merge`, `clsx` (o si está, justificado).
- [ ] Sin `'use client'` en ningún archivo.
- [ ] Tipografía no es Inter/Roboto/system-ui.
- [ ] Status nunca solo por color (ícono o texto siempre acompañan).
- [ ] Sparklines muestran gap en valores null (verificado con DevTools en algún día con null).
- [ ] Cambiar dataset con teclado (`Tab` al switcher, `←/→`) anuncia cambios por `aria-live`.
- [ ] Lighthouse a11y ≥ 95 en `?dataset=A` **y** `?dataset=D`.
- [ ] Sin warnings de React en consola al alternar A/B/C/D 4 veces seguidas.
- [ ] Bundle inicial < 200KB gz (sin Recharts es trivial; sin no, revisar).
- [ ] El video puede mostrar: header → headline 1 → KpiCard de la peor → TrendChart de la peor — y eso cuenta una historia coherente sin narración extra.

---

## 11. Cómo encaja con `IMPLEMENTATION_PLAN.md`

| Sección de este doc      | Referencia en el plan     | Fase del plan donde aplica |
| ------------------------ | ------------------------- | -------------------------- |
| §0 Crítica del prototipo | §3 Decisiones técnicas    | Antes de Fase 3            |
| §1 Principios            | §1 Lectura del problema   | Toda la implementación     |
| §2 Jerarquía             | §2.1 Jerarquía visual     | Fase 3                     |
| §3 Sistema visual        | §7.3 Estilo               | Fase 3 (apertura)          |
| §4 Por componente        | §7 Componentes UI         | Fase 3 (orden 1–6)         |
| §5 Estados               | §7.4 A11y mínimo + Fase 4 | Fase 4                     |
| §6 Microcopy             | §6 Scoring & headlines    | Fase 2 + Fase 3            |
| §7 Validación            | §11 Checklist final       | Fase 4 (DoD)               |
| §8 Lo que no va          | §10 Lo que se queda fuera | Fase 5 (README)            |
| §9 Mapping skills        | §12 Mapa de skills        | Toda la implementación     |
| §10 Checklist UI         | §11 Checklist final       | Antes de Fase 5            |

Si en algún punto este documento contradice al `IMPLEMENTATION_PLAN.md`, el plan manda. Este doc es la _lente de UI_ sobre el plan, no una versión paralela.
