import type { DayPoint, MetricKey } from '@/types/metrics';

interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number | null;
  mean: number | null;
}

export function detectAnomalies(
  days: DayPoint[],
  key: MetricKey,
  windowSize: number = 30,
  threshold: number = 2,
): AnomalyResult[] {
  const results: AnomalyResult[] = [];

  for (let i = 0; i < days.length; i++) {
    const val = days[i].metrics[key];

    if (val === null || val === undefined || i < windowSize - 1) {
      results.push({ isAnomaly: false, zScore: null, mean: null });
      continue;
    }

    const slice = days.slice(i - windowSize + 1, i + 1);
    let sum = 0;
    let count = 0;
    for (const d of slice) {
      const v = d.metrics[key];
      if (v !== null && v !== undefined) {
        sum += v;
        count++;
      }
    }

    if (count < 2) {
      results.push({ isAnomaly: false, zScore: null, mean: null });
      continue;
    }

    const mean = sum / count;
    let varianceSum = 0;
    for (const d of slice) {
      const v = d.metrics[key];
      if (v !== null && v !== undefined) {
        varianceSum += Math.pow(v - mean, 2);
      }
    }
    const stdDev = Math.sqrt(varianceSum / count);

    if (stdDev === 0) {
      results.push({ isAnomaly: false, zScore: 0, mean });
      continue;
    }

    const zScore = (val - mean) / stdDev;

    results.push({
      isAnomaly: Math.abs(zScore) > threshold,
      zScore,
      mean,
    });
  }

  return results;
}
