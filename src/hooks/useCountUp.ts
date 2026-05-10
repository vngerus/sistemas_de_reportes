import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useCountUp(value: number, duration = 700, decimals = 0) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const previousValueRef = useRef(value);
  const firstRunRef = useRef(true);

  useEffect(() => {
    const startValue = firstRunRef.current ? 0 : previousValueRef.current;
    firstRunRef.current = false;
    previousValueRef.current = value;

    if (startValue === value) {
      setDisplayValue(value);
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const nextValue = startValue + (value - startValue) * easeOutCubic(progress);
      setDisplayValue(Number(nextValue.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, decimals]);

  return displayValue;
}
