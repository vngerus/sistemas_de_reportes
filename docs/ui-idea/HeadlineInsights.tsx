import type { MetricScore } from '@/types/metrics';
import { cn } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { AlertCircle, TrendingUp, Info } from 'lucide-react';

interface HeadlineInsightsProps {
  headlines: MetricScore[];
  className?: string;
}

export function HeadlineInsights({ headlines, className }: HeadlineInsightsProps) {
  if (headlines.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info className="h-5 w-5" />
          <span>No significant changes to report</span>
        </div>
      </div>
    );
  }
  
  const hasBadMetrics = headlines.some(h => h.status === 'bad');
  
  return (
    <div
      className={cn('rounded-lg border bg-card p-4', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {hasBadMetrics ? (
          <AlertCircle className="h-5 w-5 text-status-bad" />
        ) : (
          <TrendingUp className="h-5 w-5 text-status-good" />
        )}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {hasBadMetrics ? 'Needs Attention' : 'Key Insights'}
        </h2>
      </div>
      
      {/* Headlines */}
      <div className="space-y-3">
        {headlines.map((headline, i) => (
          <div
            key={headline.key}
            className={cn(
              'flex items-start gap-3 rounded-md p-3 transition-colors',
              headline.status === 'bad' && 'bg-status-bad-bg/50',
              headline.status === 'watch' && 'bg-status-watch-bg/50',
              headline.status === 'good' && 'bg-status-good-bg/50',
              headline.status === 'neutral' && 'bg-secondary/50'
            )}
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {headline.headline}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {headline.reason}
              </p>
            </div>
            <StatusBadge status={headline.status} showIcon={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
