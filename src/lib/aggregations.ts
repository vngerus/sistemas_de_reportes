import type { DayPoint, MetricKey, FunnelStep } from '@/types/metrics';

export function windowOf(days: DayPoint[], n: number = 7): DayPoint[] {
  return days.slice(-n);
}

export function previousWindow(days: DayPoint[], n: number = 7): DayPoint[] {
  return days.slice(-(n * 2), -n);
}

export function sumMetric(days: DayPoint[], key: MetricKey): number | null {
  let sum = 0;
  let hasValue = false;

  for (const day of days) {
    const val = day.metrics[key];
    if (val !== null && val !== undefined) {
      sum += val;
      hasValue = true;
    }
  }

  return hasValue ? sum : null;
}

export function avgMetric(days: DayPoint[], key: MetricKey): number | null {
  let sum = 0;
  let count = 0;

  for (const day of days) {
    const val = day.metrics[key];
    if (val !== null && val !== undefined) {
      sum += val;
      count++;
    }
  }

  return count > 0 ? sum / count : null;
}

export function latestValue(
  days: DayPoint[],
  key: MetricKey,
): { value: number; date: string } | null {
  for (let i = days.length - 1; i >= 0; i--) {
    const val = days[i].metrics[key];
    if (val !== null && val !== undefined) {
      return { value: val, date: days[i].date };
    }
  }
  return null;
}

export function delta(
  curr: number | null,
  prev: number | null,
): { abs: number; pct: number } | null {
  if (curr === null || prev === null) return null;
  const abs = curr - prev;
  const pct = prev === 0 ? (curr > 0 ? 100 : 0) : (abs / Math.abs(prev)) * 100;
  return { abs, pct };
}

export function winRate(days: DayPoint[]): number | null {
  const won = sumMetric(days, 'deals_won') || 0;
  const lost = sumMetric(days, 'deals_lost') || 0;
  const total = won + lost;
  return total > 0 ? won / total : null;
}

export function buildFunnel(days: DayPoint[]): FunnelStep[] {
  const steps: FunnelStep[] = [
    {
      key: 'traffic',
      label: 'Tráfico',
      value: sumMetric(days, 'traffic') || 0,
      conversionRate: null,
    },
    {
      key: 'leads_created',
      label: 'Leads',
      value: sumMetric(days, 'leads_created') || 0,
      conversionRate: null,
    },
    {
      key: 'leads_qualified',
      label: 'Leads Calificados',
      value: sumMetric(days, 'leads_qualified') || 0,
      conversionRate: null,
    },
    {
      key: 'deals_created',
      label: 'Deals',
      value: sumMetric(days, 'deals_created') || 0,
      conversionRate: null,
    },
    {
      key: 'deals_won',
      label: 'Deals Ganados',
      value: sumMetric(days, 'deals_won') || 0,
      conversionRate: null,
    },
  ];
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].value;
    const curr = steps[i].value;
    steps[i].conversionRate = prev > 0 ? curr / prev : null;
  }

  return steps;
}

export function rollingAvg(
  days: DayPoint[],
  key: MetricKey,
  windowSize: number = 30,
): (number | null)[] {
  return days.map((_, i) => {
    if (i < windowSize - 1) return null;
    const slice = days.slice(i - windowSize + 1, i + 1);
    return avgMetric(slice, key);
  });
}
