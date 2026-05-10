# Notas de Análisis de Datasets (Fase 0)

Tras analizar los 4 datasets (`A`, `B`, `C`, `D`) provistos en `metrics.json` enfocándonos en los últimos 7 días vs. los 7 días previos, observamos que cada dataset presenta un "comportamiento" ("personalidad") claramente distinto. Esto asegura que la lógica de scoring producirá titulares (headlines) y un orden de KPIs diferente para cada caso.

### Dataset A
- **Personalidad:** Rendimiento estable con picos de soporte.
- **Detalle:** Las métricas de ventas están relativamente bien (`deals_won` subió 25%, `leads_created` subió 4.7%). Sin embargo, los tickets de soporte abiertos han aumentado un 14.9%.

### Dataset B
- **Personalidad:** Contracción del embudo superior y caída de ventas.
- **Detalle:** Los `leads_created` cayeron casi 12%, lo que se traduce directamente en una caída grave del 41.4% en `deals_won`. Adicionalmente, los tiempos de respuesta empeoraron un 8.8%, sugiriendo problemas en el contacto inicial.

### Dataset C
- **Personalidad:** Crecimiento fuerte y embudo saludable.
- **Detalle:** Es el escenario ideal. `deals_won` se disparó un 39.3%, impulsado por un aumento del 9.9% en `leads_created`. No hay métricas con variaciones preocupantes (todos los deltas negativos o perjudiciales son menores al 2%).

### Dataset D
- **Personalidad:** Cuello de botella severo en respuesta a leads.
- **Detalle:** Muestra un síntoma muy claro: `avg_response_time_min` se duplicó (+114.8%, pasando de ~32 min a >70 min en los últimos 7 días). Como resultado, la conversión se está estancando y `deals_won` ha caído casi un 38%.

---

**Conclusión Fase 0:**
Los datasets no son uniformes. La estrategia de calcular severidad en base a la variación porcentual `(last7 - prev7) / prev7` funcionará perfectamente para que el dashboard muestre resultados drásticamente diferentes, permitiendo cumplir el requisito central del test (el usuario debe poder diferenciar cada dataset en los primeros segundos).
