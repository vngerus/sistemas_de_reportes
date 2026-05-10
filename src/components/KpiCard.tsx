import type { MetricScore, DayPoint, MetricKey } from '@/types/metrics';
import { cn } from '@/lib/cn';
import { formatUnit, formatDelta } from '@/lib/format';
import { StatusDot } from './StatusBadge';
import { Sparkline } from './Sparkline';
import { windowOf } from '@/lib/aggregations';
import { ArrowUp, ArrowDown, Minus } from '@/components/icons';
import { useCountUp } from '@/hooks/useCountUp';

interface KpiCardProps {
  score: MetricScore;
  days: DayPoint[];
  unit: string;
  label: string;
  className?: string;
}

export function KpiCard({ score, days, unit, label, className }: KpiCardProps) {
  const recentDays = windowOf(days, 14);
  const sparklineData = recentDays.map(d => ({
    value: d.metrics[score.key as MetricKey] ?? null,
  }));

  const deltaValue = score.delta?.pct ?? null;
  const isPositive = deltaValue !== null && deltaValue > 0;
  const isNegative = deltaValue !== null && deltaValue < 0;

  const isGoodChange = score.direction === 'higher_is_better' ? isPositive : isNegative;
  const isBadChange = score.direction === 'higher_is_better' ? isNegative : isPositive;

  const animatedCurrent = useCountUp(score.current ?? 0, 700, unit === '%' ? 1 : 0);
  const animatedDeltaPct = useCountUp(deltaValue ?? 0, 700, 1);

  const animatedDelta = score.delta ? { abs: score.delta.abs, pct: animatedDeltaPct } : null;

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusDot status={score.status} />
          <span className="text-sm font-medium text-muted-foreground truncate">{label}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold tabular-nums tracking-tight transition-opacity duration-500 ease-out opacity-0 animate-fade-in">
          {formatUnit(animatedCurrent, unit)}
        </span>

        {score.delta && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-sm font-medium tabular-nums',
              isGoodChange && 'text-status-good',
              isBadChange && 'text-status-bad',
              !isGoodChange && !isBadChange && 'text-muted-foreground',
            )}
          >
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : isNegative ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {formatDelta(animatedDelta)}
          </span>
        )}
      </div>

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

      <div className="absolute inset-x-0 -bottom-1 translate-y-full opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none z-10">
        <div className="mx-2 rounded-md bg-card border border-border px-3 py-2 text-xs text-foreground shadow-lg">
          {score.reason}
        </div>
      </div>
    </div>
  );
}
