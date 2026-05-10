import { useMemo } from 'react';
import { useDatasetParam } from '@/hooks/useDatasetParam';
import { getDataset } from '@/lib/dataset-loader';
import { scoreAllMetrics, buildHeadlines } from '@/lib/scoring';
import { buildFunnel, windowOf } from '@/lib/aggregations';
import { formatDateRange } from '@/lib/format';

import { DatasetSwitcher } from '@/components/DatasetSwitcher';
import { HeadlineInsights } from '@/components/HeadlineInsights';
import { Funnel } from '@/components/Funnel';
import { MetricGrid } from '@/components/MetricGrid';
import { TrendChart } from '@/components/TrendChart';

export function Dashboard() {
  const [datasetId, setDatasetId] = useDatasetParam();

  const dataset = useMemo(() => getDataset(datasetId), [datasetId]);

  const scores = useMemo(() => scoreAllMetrics(dataset.metadata.metrics, dataset.days), [dataset]);

  const headlines = useMemo(() => buildHeadlines(scores, 3), [scores]);

  const recentDays = useMemo(() => windowOf(dataset.days, 7), [dataset]);
  const funnel = useMemo(() => buildFunnel(recentDays), [recentDays]);
  const funnelOverallStatus = scores.find(s => s.key === 'deals_won')?.status ?? 'neutral';
  const dateRange = useMemo(() => {
    const days = dataset.days;
    if (days.length === 0) return '';
    return formatDateRange(days[0].date, days[days.length - 1].date);
  }, [dataset]);

  return (
    <div className="min-h-screen bg-background pb-12">
      
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:h-16 sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                Sales Executive Report
              </h1>
              <p className="text-xs text-muted-foreground truncate">{dateRange}</p>
            </div>

            <div className="min-w-0 w-full sm:w-auto">
              <DatasetSwitcher
                value={datasetId}
                onChange={setDatasetId}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <HeadlineInsights headlines={headlines} />

        
        <div className="rounded-lg border border-border bg-card p-4">
          <Funnel steps={funnel} overallStatus={funnelOverallStatus} />
        </div>

        
        <MetricGrid scores={scores} days={dataset.days} metricDefs={dataset.metadata.metrics} />

        
        <TrendChart days={dataset.days} scores={scores} metricDefs={dataset.metadata.metrics} />
      </main>
    </div>
  );
}
