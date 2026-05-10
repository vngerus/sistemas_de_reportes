import type { DatasetId } from '@/types/metrics';
import { cn } from '@/lib/cn';

interface DatasetSwitcherProps {
  value: DatasetId;
  onChange: (id: DatasetId) => void;
  className?: string;
}

const DATASETS: DatasetId[] = ['A', 'B', 'C', 'D'];

export function DatasetSwitcher({ value, onChange, className }: DatasetSwitcherProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-center gap-1 rounded-lg bg-secondary p-1 overflow-x-auto',
        className,
      )}
      role="tablist"
      aria-label="Select dataset"
    >
      {DATASETS.map(id => (
        <button
          key={id}
          role="tab"
          aria-selected={value === id}
          aria-current={value === id ? 'page' : undefined}
          onClick={() => onChange(id)}
          className={cn(
            'relative shrink-0 px-4 py-1.5 text-sm font-medium transition-colors rounded-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            value === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Dataset {id}
        </button>
      ))}
    </div>
  );
}
