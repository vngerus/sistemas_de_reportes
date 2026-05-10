export function formatCompact(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-CL', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatUnit(value: number | null, unit: string): string {
  if (value === null) return '—';

  const formatted = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 1,
  }).format(value);

  if (unit === 'min' || unit === 'hours' || unit === 'days') {
    return `${formatted}${unit.charAt(0)}`;
  }

  if (unit === '%') {
    return `${formatted}%`;
  }

  return formatCompact(value);
}

export function formatDelta(delta: { abs: number; pct: number } | null): string {
  if (!delta) return '—';

  const pct = delta.pct;
  const sign = pct > 0 ? '+' : '';
  const decimals = Math.abs(pct) < 10 && pct !== 0 ? 1 : 0;

  return `${sign}${pct.toFixed(decimals)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatDateRange(start: string, end: string): string {
  if (!start || !end) return '';
  const dStart = new Date(start);
  const dEnd = new Date(end);

  const formatObj = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${formatObj.format(dStart)} — ${formatObj.format(dEnd)}`;
}
