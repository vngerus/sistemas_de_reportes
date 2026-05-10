import type { Status } from '@/types/metrics';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, Minus } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<Status, { label: string; icon: typeof TrendingUp; className: string }> = {
  good: {
    label: 'Good',
    icon: TrendingUp,
    className: 'bg-status-good-bg text-status-good',
  },
  watch: {
    label: 'Watch',
    icon: AlertTriangle,
    className: 'bg-status-watch-bg text-status-watch',
  },
  bad: {
    label: 'Attention',
    icon: TrendingDown,
    className: 'bg-status-bad-bg text-status-bad',
  },
  neutral: {
    label: 'Stable',
    icon: Minus,
    className: 'bg-status-neutral-bg text-status-neutral',
  },
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}

// Inline status dot for compact displays
export function StatusDot({ status, className }: { status: Status; className?: string }) {
  const colorMap: Record<Status, string> = {
    good: 'bg-status-good',
    watch: 'bg-status-watch',
    bad: 'bg-status-bad',
    neutral: 'bg-status-neutral',
  };
  
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', colorMap[status], className)}
      aria-label={status}
    />
  );
}
