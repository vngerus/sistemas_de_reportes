import type { MetricDef, DayPoint, MetricScore, Status, MetricKey } from '@/types/metrics';
import { windowOf, previousWindow, avgMetric, sumMetric, delta } from './aggregations';
import { detectAnomalies } from './anomalies';

export function scoreMetric(def: MetricDef, days: DayPoint[]): MetricScore {
  const currentDays = windowOf(days, 7);
  const prevDays = previousWindow(days, 7);
  const isAvg = def.key.startsWith('avg_') || def.key === 'stale_deals';

  const currentVal = isAvg ? avgMetric(currentDays, def.key) : sumMetric(currentDays, def.key);
  const prevVal = isAvg ? avgMetric(prevDays, def.key) : sumMetric(prevDays, def.key);

  const d = delta(currentVal, prevVal);
  const anomalies = detectAnomalies(days, def.key, 30, 2);
  const lastAnomaly = anomalies[anomalies.length - 1];
  const isCurrentlyAnomalous = lastAnomaly?.isAnomaly ?? false;
  let validCurrent = 0;
  for (const day of currentDays) if (day.metrics[def.key] !== null) validCurrent++;

  if (validCurrent < 3) {
    return {
      key: def.key,
      status: 'neutral',
      severity: 0,
      headline: `${def.label}: datos insuficientes.`,
      reason:
        'No hay suficientes datos en la ventana actual para calcular una tendencia confiable.',
      current: currentVal,
      delta: d,
      direction: def.direction,
    };
  }

  let status: Status = 'neutral';
  let severity = 0;

  if (d) {
    const isHigherBetter = def.direction === 'higher_is_better';
    const isImproving = isHigherBetter ? d.pct > 0 : d.pct < 0;
    const absPct = Math.abs(d.pct);

    if (!isImproving && absPct >= 20) {
      status = 'bad';
      severity = absPct;
    } else if (!isImproving && absPct >= 5) {
      status = 'watch';
      severity = absPct * 0.5;
    } else if (isImproving && absPct >= 5) {
      status = 'good';
      severity = absPct * 0.1;
    }
  }
  if (isCurrentlyAnomalous && lastAnomaly && lastAnomaly.zScore !== null && currentVal !== null) {
    const isHigherBetter = def.direction === 'higher_is_better';
    const isBadAnomaly = isHigherBetter ? lastAnomaly.zScore < 0 : lastAnomaly.zScore > 0;

    if (isBadAnomaly) {
      status = 'bad';
      severity = Math.max(severity, Math.abs(lastAnomaly.zScore * 10));
    }
  }

  return {
    key: def.key,
    status,
    severity,
    headline: generateHeadline(def, status, d, isCurrentlyAnomalous),
    reason: generateReason(def, status, d),
    current: currentVal,
    delta: d,
    direction: def.direction,
  };
}

export function scoreAllMetrics(defs: MetricDef[], days: DayPoint[]): MetricScore[] {
  return defs.map(def => scoreMetric(def, days));
}

export function buildHeadlines(scores: MetricScore[], max: number = 3): MetricScore[] {
  const sorted = [...scores].sort((a, b) => {
    const rank = { bad: 4, watch: 3, good: 2, neutral: 1 };
    if (rank[a.status] !== rank[b.status]) {
      return rank[b.status] - rank[a.status];
    }
    return b.severity - a.severity;
  });

  return sorted.slice(0, max);
}
function getConsequence(key: MetricKey): string {
  const consequences: Record<MetricKey, string> = {
    traffic: 'fewer prospects entering the funnel',
    leads_created: 'fewer opportunities for the team',
    leads_qualified: 'pipeline drying up',
    deals_created: 'fewer opportunities in negotiation',
    deals_won: 'direct impact on revenue',
    deals_lost: 'loss of sales effort',
    avg_response_time_min: 'hurting lead conversion',
    avg_deal_cycle_days: 'slowing down revenue realization',
    stale_deals: 'deals stalling without progression',
    support_tickets_opened: 'higher volume of issues',
    support_avg_resolution_hours: 'tickets taking longer to resolve',
  };
  return consequences[key] || 'affecting overall performance';
}

function generateHeadline(
  def: MetricDef,
  status: Status,
  d: { abs: number; pct: number } | null,
  isAnomalous: boolean,
): string {
  if (status === 'neutral' || !d) return `${def.label} stable.`;

  const verb = d.pct > 0 ? 'rose' : 'fell';
  const pctStr = `${Math.abs(d.pct).toFixed(0)}%`;

  if (status === 'bad') {
    const anomalySuffix = isAnomalous ? ' (Anomaly detected!)' : '';
    return `${def.label} ${verb} ${pctStr} this week — ${getConsequence(def.key)}.${anomalySuffix}`;
  }
  if (status === 'good') {
    return `${def.label} ${verb} ${pctStr} — the best signal this week.`;
  }
  if (status === 'watch') {
    return `Monitoring ${def.label.toLowerCase()}, ${verb} ${pctStr}.`;
  }

  return `${def.label} stable.`;
}

function generateReason(
  def: MetricDef,
  status: Status,
  d: { abs: number; pct: number } | null,
): string {
  if (!d) return `${def.label} no significant variation.`;
  if (status === 'bad') return `Significant detrimental variation (>20% or anomaly).`;
  if (status === 'good') return `Notable improvement compared to the previous 7 days.`;
  if (status === 'watch') return `Slightly negative trend to monitor.`;
  return `${def.label} no significant variation.`;
}
