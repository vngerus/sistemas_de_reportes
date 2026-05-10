import type { DatasetId } from '@/types/metrics';
import { cn } from '@/lib/utils';

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
        'inline-flex items-center rounded-lg bg-secondary p-1',
        className
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
            'relative px-4 py-1.5 text-sm font-medium transition-colors rounded-md',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            value === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Dataset {id}
        </button>
      ))}
    </div>
  );
}
