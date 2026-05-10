import type { FunnelStep } from '@/types/metrics';
import { cn } from '@/lib/utils';
import { formatCompact } from '@/lib/format';
import { ChevronRight } from 'lucide-react';

interface FunnelProps {
  steps: FunnelStep[];
  className?: string;
}

export function Funnel({ steps, className }: FunnelProps) {
  const maxValue = Math.max(...steps.map(s => s.value));

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>Sales Funnel (7 days)</span>
      </div>

      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const widthPercent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              {/* Step */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1 truncate">{step.label}</div>
                <div className="relative h-10 bg-secondary rounded overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-chart-1 rounded transition-all duration-500"
                    style={{ width: `${Math.max(widthPercent, 5)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold tabular-nums text-foreground drop-shadow-sm">
                      {formatCompact(step.value)}
                    </span>
                  </div>
                </div>
                {/* Conversion rate */}
                {step.conversionRate !== null && (
                  <div className="text-xs text-muted-foreground mt-1 text-center">
                    {(step.conversionRate * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Arrow */}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact funnel for mobile
export function FunnelCompact({ steps, className }: FunnelProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {steps.map((step, i) => {
        const prevStep = steps[i - 1];

        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="w-20 text-xs text-muted-foreground truncate">{step.label}</div>
            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden relative">
              <div
                className="absolute inset-y-0 left-0 bg-chart-1 rounded-full"
                style={{
                  width: `${Math.max((step.value / steps[0].value) * 100, 2)}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {prevStep && prevStep.value > 0
                ? `${(((prevStep.value - step.value) / prevStep.value) * 100).toFixed(0)}%`
                : '0%'}
            </span>
            <div className="w-16 text-right">
              <span className="text-sm font-medium tabular-nums">{formatCompact(step.value)}</span>
            </div>
            {step.conversionRate !== null && (
              <div className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                {(step.conversionRate * 100).toFixed(0)}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
