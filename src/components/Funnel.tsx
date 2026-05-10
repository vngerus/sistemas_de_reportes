import type { FunnelStep, Status } from '@/types/metrics';
import { cn } from '@/lib/cn';
import { formatCompact } from '@/lib/format';
import { ChevronRight, ArrowDown } from '@/components/icons';

interface FunnelProps {
  steps: FunnelStep[];
  className?: string;
  overallStatus?: Status;
}

export function Funnel({ steps, className, overallStatus = 'neutral' }: FunnelProps) {
  const maxValue = Math.max(...steps.map(s => s.value), 1);

  const barColorClass =
    overallStatus === 'bad'
      ? 'bg-status-bad'
      : overallStatus === 'watch'
        ? 'bg-status-watch'
        : 'bg-chart-1';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span>Sales Funnel (7 days)</span>
      </div>

      <div className="hidden sm:flex items-center gap-2">
        {steps.map((step, i) => {
          const widthPercent = (step.value / maxValue) * 100;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 min-w-0 flex flex-col items-center">
                <div className="text-xs font-medium text-muted-foreground mb-2 truncate max-w-full">
                  {step.label}
                </div>
                <div className="relative w-full h-12 bg-secondary/50 rounded-md overflow-hidden border border-border">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-md transition-all duration-500',
                      barColorClass,
                    )}
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold tabular-nums text-foreground drop-shadow-md">
                      {formatCompact(step.value)}
                    </span>
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="flex flex-col items-center justify-center mx-2 w-12 shrink-0 mt-6">
                  {steps[i + 1].conversionRate !== null && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-background px-1 rounded border border-border relative z-10 -mb-2">
                      {(steps[i + 1].conversionRate! * 100).toFixed(0)}%
                    </span>
                  )}
                  <div className="h-px w-full bg-border -mt-px"></div>
                  <ChevronRight className="h-4 w-4 text-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex sm:hidden flex-col gap-4">
        {steps.map((step, i) => {
          const widthPercent = (step.value / maxValue) * 100;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-muted-foreground truncate">
                  {step.label}
                </div>
                <div className="flex-1 h-8 bg-secondary/50 rounded-md overflow-hidden relative border border-border">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-md transition-all',
                      barColorClass,
                    )}
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <span className="text-xs font-semibold tabular-nums drop-shadow-md">
                      {formatCompact(step.value)}
                    </span>
                  </div>
                </div>
              </div>

              {!isLast && steps[i + 1].conversionRate !== null && (
                <div className="flex items-center ml-24 pl-3 py-2 border-l-2 border-border/50 text-[10px] text-muted-foreground">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {(steps[i + 1].conversionRate! * 100).toFixed(0)}% conversion
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
