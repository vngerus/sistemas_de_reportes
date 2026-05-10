# Palvi Executive Dashboard

Un reporte ejecutivo diseñado para que un Jefe de Ventas entienda el estado de la operación (Pipeline, Velocidad y Soporte) en 5 minutos o menos.

## Instalación y ejecución

1. Clonar el repositorio:

```bash
git clone https://github.com/vngerus/sistemas_de_reportes
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar el proyecto:

```bash
npm run dev
```

4. Abrir el dashboard en el navegador:

```text
http://localhost:5173/
```

4. Comandos útiles:

```bash
npm run dev      # inicia el servidor en modo desarrollo
npm run build    # genera la versión de producción
npm run preview  # sirve el build estático para revisión
npm run lint     # ejecuta ESLint
npm run test     # corre las pruebas con Vitest
```

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- lucide-react

## Estructura del proyecto

- `src/components/` — componentes visuales del dashboard
- `src/lib/` — lógica de métricas, scoring, detección de anomalías, agregaciones y formatos
- `src/hooks/useDatasetParam.ts` — dataset actual en la URL
- `src/types/metrics.ts` — tipos de datos principales
- `src/data/metrics.json` — datos de ejemplo usados por la demo
- `docs/SHOW_PROJECT.md` — guía rápida para presentar el proyecto
- `docs/UI_DESIGN_REFERENCE.md` — decisiones visuales y ajustes de diseño
- `docs/IMPLEMENTATION_PLAN.md` — decisiones técnicas generales

## Decisiones técnicas

- **React 19 + TypeScript + Vite:** stack moderno con desarrollo rápido y tipado fuerte.
- **Tailwind CSS sin librería UI pesada:** control completo del diseño sin dependencias de componentes.
- **Gráficos con Recharts + sparklines custom:** `TrendChart` usa Recharts para mantener un chart sostenible y los sparklines mantienen un render ligero.
- **Iconos con `lucide-react`:** íconos simples y consistentes.
- **Datos locales importados:** validación y lógica desde TypeScript sin librerías de parseo externas.
- **URL-friendly:** `useDatasetParam` mantiene `?dataset=X` en la URL para history y share.

## Lo que quedó fuera si se extendiera

- Comparación entre datasets (A vs B).
- Drill-down contextual desde cada KPI.
- Alertas configurables por el usuario.
- Exportar reportes a PDF o compartir en Slack/Teams.
- Persistencia de preferencias de visualización en `localStorage`.
- Pruebas E2E visuales con Playwright.
