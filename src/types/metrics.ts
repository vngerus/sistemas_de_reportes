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
  date: string;
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

export type DatasetId = Dataset['id'];

export type Status = 'good' | 'watch' | 'bad' | 'neutral';

export interface MetricScore {
  key: MetricKey;
  status: Status;
  severity: number;
  headline: string;
  reason: string;
  current: number | null;
  delta: { abs: number; pct: number } | null;
  direction: Direction;
}

export interface FunnelStep {
  key: string;
  label: string;
  value: number;
  conversionRate: number | null;
}
