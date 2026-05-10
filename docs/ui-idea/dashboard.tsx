'use client';

import { useMemo } from 'react';
import { useDatasetParam } from '@/hooks/use-dataset-param';
import { getDataset } from '@/lib/dataset-loader';
import { scoreAllMetrics, buildHeadlines } from '@/lib/scoring';
import { buildFunnel, winRate, windowOf } from '@/lib/aggregations';
import { formatDateRange } from '@/lib/format';

import { DatasetSwitcher } from '@/components/dashboard/dataset-switcher';
import { HeadlineInsights } from '@/components/dashboard/headline-insights';
import { Funnel } from '@/components/dashboard/funnel';
import { MetricGrid } from '@/components/dashboard/metric-grid';
import { TrendChart } from '@/components/dashboard/trend-chart';

export function Dashboard() {
  const [datasetId, setDatasetId] = useDatasetParam();
  
  const dataset = useMemo(() => getDataset(datasetId), [datasetId]);
  
  const scores = useMemo(
    () => scoreAllMetrics(dataset.metadata.metrics, dataset.days),
    [dataset]
  );
  
  const headlines = useMemo(() => buildHeadlines(scores, 3), [scores]);
  
  const recentDays = useMemo(() => windowOf(dataset.days, 7), [dataset]);
  const funnel = useMemo(() => buildFunnel(recentDays), [recentDays]);
  const currentWinRate = useMemo(() => winRate(recentDays), [recentDays]);
  
  // Date range display
  const dateRange = useMemo(() => {
    const days = dataset.days;
    if (days.length === 0) return '';
    return formatDateRange(days[0].date, days[days.length - 1].date);
  }, [dataset]);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Sales Executive Report
              </h1>
              <p className="text-xs text-muted-foreground">
                {dateRange}
              </p>
            </div>
            
            <DatasetSwitcher
              value={datasetId}
              onChange={setDatasetId}
            />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Win rate summary */}
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {currentWinRate !== null ? `${(currentWinRate * 100).toFixed(1)}%` : '—'}
            </span>
            <span className="text-sm text-muted-foreground">Win Rate (7d)</span>
          </div>
        </div>
        
        {/* Headlines */}
        <HeadlineInsights headlines={headlines} />
        
        {/* Funnel */}
        <div className="rounded-lg border border-border bg-card p-4">
          <Funnel steps={funnel} />
        </div>
        
        {/* Two column layout for chart and grid on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <TrendChart
            days={dataset.days}
            scores={scores}
            metricDefs={dataset.metadata.metrics}
          />
          
          {/* Summary Stats Card */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Period Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Days</p>
                <p className="text-xl font-semibold tabular-nums">{dataset.metadata.days}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Metrics Tracked</p>
                <p className="text-xl font-semibold tabular-nums">{dataset.metadata.metrics.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
                <p className="text-xl font-semibold tabular-nums text-status-bad">
                  {scores.filter(s => s.status === 'bad').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Performing Well</p>
                <p className="text-xl font-semibold tabular-nums text-status-good">
                  {scores.filter(s => s.status === 'good').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* KPI Grid */}
        <MetricGrid
          scores={scores}
          days={dataset.days}
          metricDefs={dataset.metadata.metrics}
        />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-muted-foreground text-center">
            Data refreshed from static dataset. Last entry: {dataset.metadata.end_date}
          </p>
        </div>
      </footer>
    </div>
  );
}
