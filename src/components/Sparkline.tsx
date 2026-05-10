import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/cn';

interface SparklineProps {
  data: Array<{ value: number | null }>;
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
  fillColor?: string;
  showArea?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  className,
  strokeColor = 'currentColor',
  fillColor,
  showArea = false,
}: SparklineProps) {
  const [animate, setAnimate] = useState(false);

  const chartData = useMemo(
    () => data.map((point, index) => ({ index, value: point.value })),
    [data],
  );

  const values = useMemo(
    () => data.map(d => d.value).filter((v): v is number => v !== null),
    [data],
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => {
      cancelAnimationFrame(id);
      setAnimate(false);
    };
  }, [data, width, height, showArea]);

  if (values.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground text-xs', className)}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden', className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          {showArea && (
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={fillColor || strokeColor}
              fillOpacity={0.12}
              connectNulls={false}
              isAnimationActive={animate}
              animationDuration={700}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={animate}
            animationDuration={700}
          />
          <XAxis dataKey="index" hide />
          <YAxis domain={['dataMin', 'dataMax']} hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
