'use client';

import { useCallback } from 'react';
import { trackClient } from '@/lib/analytics/client';

export function useTrack() {
  return useCallback((event: string) => {
    // Only event names are sent; no properties to avoid PII
    trackClient(event);
  }, []);
}