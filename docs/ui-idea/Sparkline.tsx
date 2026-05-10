'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

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
  const { path, areaPath, viewBox } = useMemo(() => {
    // Filter out null values but keep track of indices for gaps
    const points: Array<{ x: number; y: number }> = [];
    
    // Find min/max for normalization
    const values = data.map(d => d.value).filter((v): v is number => v !== null);
    
    if (values.length < 2) {
      return { path: '', areaPath: '', viewBox: `0 0 ${width} ${height}` };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Padding for the stroke
    const padding = 2;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    
    // Build points
    data.forEach((d, i) => {
      if (d.value !== null) {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((d.value - min) / range) * chartHeight;
        points.push({ x, y });
      }
    });
    
    if (points.length < 2) {
      return { path: '', areaPath: '', viewBox: `0 0 ${width} ${height}` };
    }
    
    // Build SVG path
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    
    // Build area path (closed polygon)
    const areaPath = showArea
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`
      : '';
    
    return {
      path: linePath,
      areaPath,
      viewBox: `0 0 ${width} ${height}`,
    };
  }, [data, width, height, showArea]);
  
  if (!path) {
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
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      {showArea && areaPath && (
        <path
          d={areaPath}
          fill={fillColor || 'currentColor'}
          opacity={0.1}
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
