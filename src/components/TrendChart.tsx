import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DotItemDotProps, TooltipContentProps, TooltipValueType } from 'recharts';
import type { MetricKey, DayPoint, MetricScore, MetricDef } from '@/types/metrics';
import { cn } from '@/lib/cn';
import { formatDate, formatUnit } from '@/lib/format';
import { detectAnomalies } from '@/lib/anomalies';
import { StatusBadge } from '@/components/StatusBadge';
interface TrendChartProps {
  days: DayPoint[];
  scores: MetricScore[];
  metricDefs: MetricDef[];
  defaultMetric?: MetricKey;
  className?: string;
}

type TrendChartDatum = {
  date: string;
  value: number | null;
  anomaly: boolean;
  mean: number | null;
  formattedDate: string;
};

type TrendChartTooltipProps = TooltipContentProps<TooltipValueType, string | number>;

export function TrendChart({
  days,
  scores,
  metricDefs,
  defaultMetric,
  className,
}: TrendChartProps) {
  const initialMetric = defaultMetric ?? scores.find(s => s.status === 'bad')?.key ?? 'deals_won';
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>(initialMetric);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsChartReady(true));
    return () => cancelAnimationFrame(id);
  }, [selectedMetric, days]);

  const metricDef = metricDefs.find(m => m.key === selectedMetric);
  const score = scores.find(s => s.key === selectedMetric);

  const chartData = useMemo(() => {
    const anomalies = detectAnomalies(days, selectedMetric, 30, 2);

    return days.map((day, i) => ({
      date: day.date,
      value: day.metrics[selectedMetric] ?? null,
      anomaly: anomalies[i]?.isAnomaly ?? false,
      mean: anomalies[i]?.mean ?? null,
      formattedDate: formatDate(day.date),
    }));
  }, [days, selectedMetric]);

  const values = useMemo(
    () => chartData.map(d => d.value).filter((v): v is number => v !== null),
    [chartData],
  );

  const strokeColor = useMemo(() => {
    if (!score) return 'var(--chart-1)';
    switch (score.status) {
      case 'bad':
        return 'var(--status-bad)';
      case 'watch':
        return 'var(--status-watch)';
      case 'good':
        return 'var(--status-good)';
      default:
        return 'var(--chart-1)';
    }
  }, [score]);

  const yDomain = useMemo(() => {
    if (values.length === 0) {
      return [0, 1] as [number, number];
    }

    const means = chartData.map(d => d.mean).filter((v): v is number => v !== null);
    const maxVal = Math.max(...values, ...means);
    const minVal = Math.min(...values, ...means);
    const range = maxVal - minVal || 1;
    const yMax = maxVal + range * 0.1;
    const yMin = Math.max(0, minVal - range * 0.1);

    return [yMin, yMax] as [number, number];
  }, [chartData, values]);

  const xTickValues = useMemo(() => {
    if (chartData.length === 0) return [] as string[];
    const step = Math.floor(chartData.length / 4);
    return [0, step, step * 2, step * 3, chartData.length - 1]
      .map(i => chartData[i]?.formattedDate)
      .filter((label): label is string => Boolean(label));
  }, [chartData]);

  const hasTrend = values.length > 1;

  const renderDot = (props: DotItemDotProps) => {
    if (!props.payload?.anomaly) return null;
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={4}
        fill="var(--status-bad)"
        stroke="var(--background)"
        strokeWidth={1.5}
      />
    );
  };

  const tooltipContent = ({ active, payload }: TrendChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload as TrendChartDatum | undefined;
    if (!point) return null;

    return (
      <div className="rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
        <p className="text-muted-foreground text-[10px]">{point.formattedDate}</p>
        <p className="font-semibold tabular-nums mt-1">
          {formatUnit(point.value, metricDef?.unit ?? '')}
        </p>
        {point.anomaly && <p className="text-status-bad font-medium mt-1">Anomaly detected</p>}
      </div>
    );
  };

  if (!hasTrend) {
    return (
      <div className={cn('rounded-lg border border-border bg-card p-4 flex flex-col', className)}>
        <Header
          metricDef={metricDef}
          score={score}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          metricDefs={metricDefs}
        />
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground min-h-50">
          Insufficient data for trend.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-lg border border-border bg-card p-4 flex flex-col gap-4', className)}
    >
      <Header
        metricDef={metricDef}
        score={score}
        selectedMetric={selectedMetric}
        setSelectedMetric={setSelectedMetric}
        metricDefs={metricDefs}
      />

      <div className="relative w-full aspect-800/240 group select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              ticks={xTickValues}
              interval={0}
              minTickGap={10}
            />
            <YAxis
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              width={40}
            />
            <Tooltip
              content={tooltipContent}
              cursor={{ stroke: 'var(--foreground)', strokeDasharray: '3 3', opacity: 0.3 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={renderDot}
              activeDot={{ r: 5, fill: strokeColor, stroke: 'var(--background)', strokeWidth: 2 }}
              isAnimationActive={isChartReady}
              animationDuration={900}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Header({
  metricDef,
  score,
  selectedMetric,
  setSelectedMetric,
  metricDefs,
}: {
  metricDef: MetricDef | undefined;
  score: MetricScore | undefined;
  selectedMetric: MetricKey;
  setSelectedMetric: (value: MetricKey) => void;
  metricDefs: MetricDef[];
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{metricDef?.label}</h3>
          {score && <StatusBadge status={score.status} />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{metricDef?.description}</p>
      </div>

      <select
        value={selectedMetric}
        onChange={e => setSelectedMetric(e.target.value as MetricKey)}
        className="text-sm bg-secondary border border-border rounded-md px-3 py-1.5 text-foreground focus:ring-2 focus:ring-ring outline-none max-w-xs"
        aria-label="Select metric for chart"
      >
        {metricDefs.map((def: MetricDef) => (
          <option key={def.key} value={def.key} className="bg-card text-foreground">
            {def.label}
          </option>
        ))}
      </select>
    </div>
  );
}
