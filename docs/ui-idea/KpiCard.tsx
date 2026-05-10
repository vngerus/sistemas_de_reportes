import type { MetricScore, DayPoint, MetricKey } from '@/types/metrics';
import { cn } from '@/lib/utils';
import { formatUnit, formatDelta } from '@/lib/format';
import { StatusDot } from './status-badge';
import { Sparkline } from './sparkline';
import { windowOf } from '@/lib/aggregations';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KpiCardProps {
  score: MetricScore;
  days: DayPoint[];
  unit: string;
  className?: string;
}

export function KpiCard({ score, days, unit, className }: KpiCardProps) {
  const recentDays = windowOf(days, 14);
  const sparklineData = recentDays.map(d => ({
    value: d.metrics[score.key as MetricKey] ?? null,
  }));
  
  const deltaValue = score.delta?.pct ?? null;
  const isPositive = deltaValue !== null && deltaValue > 0;
  const isNegative = deltaValue !== null && deltaValue < 0;
  
  // Determine if the change is good or bad based on direction
  const isGoodChange = score.direction === 'higher_is_better' ? isPositive : isNegative;
  const isBadChange = score.direction === 'higher_is_better' ? isNegative : isPositive;
  
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusDot status={score.status} />
          <span className="text-sm font-medium text-muted-foreground">
            {score.headline.split(':')[0]}
          </span>
        </div>
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {formatUnit(score.current, unit)}
        </span>
        
        {/* Delta */}
        {score.delta && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-sm font-medium tabular-nums',
              isGoodChange && 'text-status-good',
              isBadChange && 'text-status-bad',
              !isGoodChange && !isBadChange && 'text-muted-foreground'
            )}
          >
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : isNegative ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {formatDelta(score.delta)}
          </span>
        )}
      </div>
      
      {/* Sparkline */}
      <div className="mt-auto">
        <Sparkline
          data={sparklineData}
          width={120}
          height={28}
          strokeColor={
            score.status === 'bad'
              ? 'var(--status-bad)'
              : score.status === 'good'
              ? 'var(--status-good)'
              : score.status === 'watch'
              ? 'var(--status-watch)'
              : 'var(--muted-foreground)'
          }
          showArea
          fillColor={
            score.status === 'bad'
              ? 'var(--status-bad)'
              : score.status === 'good'
              ? 'var(--status-good)'
              : score.status === 'watch'
              ? 'var(--status-watch)'
              : 'var(--muted-foreground)'
          }
        />
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute inset-x-0 -bottom-1 translate-y-full opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10">
        <div className="mx-2 rounded-md bg-popover border border-border px-3 py-2 text-xs text-popover-foreground shadow-lg">
          {score.reason}
        </div>
      </div>
    </div>
  );
}
