'use client';

import { useCallback, useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveRestSeconds, loadRestSeconds } from '@/app/actions/timer';

interface KTimerProps {
  workoutId: string;
  defaultSeconds: number;
  onTick?: (seconds: number) => void;
  onStop?: (seconds: number) => void;
}

export function KTimer({ workoutId, defaultSeconds, onTick, onStop }: KTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setRunning] = useState(false);
  const storageKey = `kairos:timer:${workoutId}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localValue = Number(window.localStorage.getItem(storageKey) ?? '');
      if (!Number.isNaN(localValue) && localValue >= 0) {
        setSeconds(localValue);
      }
    }

    let cancelled = false;
    (async () => {
      try {
        const persisted = await loadRestSeconds(workoutId);
        if (!cancelled && typeof persisted === 'number' && persisted >= 0) {
          setSeconds(persisted);
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          const fallbackValue = Number(window.localStorage.getItem(storageKey) ?? '');
          if (!Number.isNaN(fallbackValue) && fallbackValue >= 0) {
            setSeconds(fallbackValue);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageKey, workoutId]);

  const persistSeconds = useCallback(
    async (value: number) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, String(value));
      }
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          await saveRestSeconds(workoutId, value);
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(storageKey);
          }
        } catch (error) {
          // mantener valor en localStorage hasta reintento
        }
      }
    },
    [storageKey, workoutId]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      const stored = Number(window.localStorage.getItem(storageKey) ?? '');
      if (!Number.isNaN(stored)) {
        void persistSeconds(stored);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [persistSeconds, storageKey]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(async () => {
      setSeconds((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        onTick?.(next);
        void persistSeconds(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, onTick, persistSeconds]);

  useEffect(() => {
    if (seconds === 0 && isRunning) {
      setRunning(false);
      void persistSeconds(0);
      onStop?.(0);
    }
  }, [seconds, isRunning, onStop, persistSeconds]);

  return (
    <button
      type="button"
      onClick={() => {
        if (isRunning) {
          setRunning(false);
          void persistSeconds(seconds);
          onStop?.(seconds);
        } else {
          setSeconds(defaultSeconds);
          void persistSeconds(defaultSeconds);
          setRunning(true);
        }
      }}
      className={cn(
        'flex items-center gap-1 rounded-full px-3 py-1 text-foreground transition',
        isRunning ? 'bg-accent-coral/20' : 'bg-accent-teal/20'
      )}
    >
      <Timer className="h-4 w-4" />
      {seconds}s
    </button>
  );
}