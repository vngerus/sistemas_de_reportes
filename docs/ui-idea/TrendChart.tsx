'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MetricKey, DayPoint, MetricScore, MetricDef } from '@/types/metrics';
import { cn } from '@/lib/utils';
import { formatDate, formatUnit } from '@/lib/format';
import { detectAnomalies } from '@/lib/anomalies';

interface TrendChartProps {
  days: DayPoint[];
  scores: MetricScore[];
  metricDefs: MetricDef[];
  defaultMetric?: MetricKey;
  className?: string;
}

export function TrendChart({
  days,
  scores,
  metricDefs,
  defaultMetric,
  className,
}: TrendChartProps) {
  // Default to the most alarmed metric
  const initialMetric = defaultMetric ?? scores.find(s => s.status === 'bad')?.key ?? 'deals_won';
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(initialMetric);
  
  const metricDef = metricDefs.find(m => m.key === selectedMetric);
  const score = scores.find(s => s.key === selectedMetric);
  
  const chartData = useMemo(() => {
    const anomalies = detectAnomalies(days, selectedMetric);
    
    return days.map((day, i) => ({
      date: day.date,
      value: day.metrics[selectedMetric] ?? null,
      anomaly: anomalies[i]?.isAnomaly ?? false,
      formattedDate: formatDate(day.date),
    }));
  }, [days, selectedMetric]);
  
  // Calculate average for reference line
  const avg = useMemo(() => {
    const values = chartData.filter(d => d.value !== null).map(d => d.value as number);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [chartData]);
  
  // Get stroke color based on status
  const strokeColor = useMemo(() => {
    if (!score) return 'var(--chart-1)';
    switch (score.status) {
      case 'bad': return 'var(--status-bad)';
      case 'watch': return 'var(--status-watch)';
      case 'good': return 'var(--status-good)';
      default: return 'var(--chart-1)';
    }
  }, [score]);
  
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {metricDef?.label ?? 'Metric Trend'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {metricDef?.description}
          </p>
        </div>
        
        {/* Metric selector */}
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
          className="text-sm bg-secondary border-none rounded-md px-3 py-1.5 text-foreground focus:ring-2 focus:ring-ring"
        >
          {metricDefs.map(def => (
            <option key={def.key} value={def.key}>
              {def.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="formattedDate"
              stroke="var(--muted-foreground)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={45}
              tickFormatter={(v) => formatUnit(v, metricDef?.unit ?? '')}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-md bg-popover border border-border px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">{data.formattedDate}</p>
                    <p className="text-sm font-medium">
                      {formatUnit(data.value, metricDef?.unit ?? '')}
                    </p>
                    {data.anomaly && (
                      <p className="text-xs text-status-bad mt-1">Anomaly detected</p>
                    )}
                  </div>
                );
              }}
            />
            
            {/* Average reference line */}
            {avg !== null && (
              <ReferenceLine
                y={avg}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            )}
            
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: strokeColor,
                stroke: 'var(--background)',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className="w-8 h-0.5"
            style={{ backgroundColor: strokeColor }}
          />
          <span>{metricDef?.label}</span>
        </div>
        {avg !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-0.5 bg-muted-foreground opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(to right, var(--muted-foreground) 0, var(--muted-foreground) 3px, transparent 3px, transparent 6px)' }} />
            <span>Average</span>
          </div>
        )}
      </div>
    </div>
  );
}
