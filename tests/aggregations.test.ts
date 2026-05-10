import { describe, it, expect } from 'vitest';
import { sumMetric, avgMetric, delta, winRate } from '../src/lib/aggregations';
import type { DayPoint } from '../src/types/metrics';

describe('Aggregations', () => {
  const mockDays: DayPoint[] = [
    { date: '2025-01-01', metrics: { deals_won: 5, deals_lost: 5, traffic: null } },
    { date: '2025-01-02', metrics: { deals_won: 10, deals_lost: 0, traffic: 100 } },
  ];

  it('sumMetric ignores nulls', () => {
    expect(sumMetric(mockDays, 'deals_won')).toBe(15);
    expect(sumMetric(mockDays, 'traffic')).toBe(100);
  });

  it('avgMetric calculates correctly', () => {
    expect(avgMetric(mockDays, 'deals_won')).toBe(7.5);
    // Traffic has only 1 non-null day, so avg is 100
    expect(avgMetric(mockDays, 'traffic')).toBe(100);
  });

  it('delta handles prev=0', () => {
    expect(delta(10, 0)).toEqual({ abs: 10, pct: 100 });
  });

  it('winRate calculates correctly', () => {
    // 15 won, 5 lost -> 15/20 = 0.75
    expect(winRate(mockDays)).toBe(0.75);
  });
});
