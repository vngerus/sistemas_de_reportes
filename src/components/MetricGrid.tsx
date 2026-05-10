import type { MetricScore, DayPoint, MetricDef } from '@/types/metrics';
import { cn } from '@/lib/cn';
import { KpiCard } from './KpiCard';

interface MetricGridProps {
  scores: MetricScore[];
  days: DayPoint[];
  metricDefs: MetricDef[];
  className?: string;
}

export function MetricGrid({ scores, days, metricDefs, className }: MetricGridProps) {
  const salesMetrics = scores.filter(s =>
    [
      'traffic',
      'leads_created',
      'leads_qualified',
      'deals_created',
      'deals_won',
      'deals_lost',
    ].includes(s.key),
  );

  const velocityMetrics = scores.filter(s =>
    ['avg_response_time_min', 'avg_deal_cycle_days', 'stale_deals'].includes(s.key),
  );

  const supportMetrics = scores.filter(s =>
    ['support_tickets_opened', 'support_avg_resolution_hours'].includes(s.key),
  );

  const getUnit = (key: string) => {
    const def = metricDefs.find(m => m.key === key);
    return def?.unit ?? '';
  };

  return (
    <div className={cn('space-y-6', className)}>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Sales Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {salesMetrics.map(score => (
            <KpiCard
              key={score.key}
              score={score}
              days={days}
              unit={getUnit(score.key)}
              label={metricDefs.find(m => m.key === score.key)?.label ?? score.key}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Sales Velocity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {velocityMetrics.map(score => (
            <KpiCard
              key={score.key}
              score={score}
              days={days}
              unit={getUnit(score.key)}
              label={metricDefs.find(m => m.key === score.key)?.label ?? score.key}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Support
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {supportMetrics.map(score => (
            <KpiCard
              key={score.key}
              score={score}
              days={days}
              unit={getUnit(score.key)}
              label={metricDefs.find(m => m.key === score.key)?.label ?? score.key}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
