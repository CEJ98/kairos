'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PhotoComparator({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [split, setSplit] = useState(50); // %

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparador de Fotos</CardTitle>
        <CardDescription>Desliza para comparar antes vs después</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full max-w-xl mx-auto">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg border">
            {/* After (full) */}
            <Image src={afterUrl} alt="Después" fill className="object-cover" />
            {/* Before (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${split}%` }}
            >
              <Image src={beforeUrl} alt="Antes" fill className="object-cover" />
            </div>
            {/* Divider */}
            <div
              className="absolute top-0 bottom-0"
              style={{ left: `${split}%` }}
            >
              <div className="w-0.5 h-full bg-white/80 shadow" />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            className="mt-4 w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}