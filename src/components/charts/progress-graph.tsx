"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Simple SVG line chart with dummy data
export type DataPoint = { label: string; value: number };

const dummyData: DataPoint[] = [
  { label: "Sem 1", value: 72.0 },
  { label: "Sem 2", value: 72.4 },
  { label: "Sem 3", value: 73.1 },
  { label: "Sem 4", value: 73.6 },
  { label: "Sem 5", value: 74.0 },
  { label: "Sem 6", value: 74.6 },
  { label: "Sem 7", value: 75.2 },
  { label: "Sem 8", value: 75.4 }
];

function useChartLayout(points: DataPoint[]) {
  const padding = { top: 16, right: 16, bottom: 24, left: 32 };
  const width = 640;
  const height = 240;
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yScale = (v: number) => {
    const domain = max - min || 1;
    const range = height - padding.top - padding.bottom;
    return height - padding.bottom - ((v - min) / domain) * range;
  };
  const xScale = (i: number) => {
    const range = width - padding.left - padding.right;
    const step = points.length > 1 ? range / (points.length - 1) : 0;
    return padding.left + i * step;
  };
  return { width, height, padding, xScale, yScale, min, max };
}

export function ProgressGraph({ data = dummyData, title = "Progreso", description = "Tendencia semanal" }: { data?: DataPoint[]; title?: string; description?: string }) {
  const { width, height, padding, xScale, yScale, min, max } = useChartLayout(data);

  const path = data
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(p.value)}`)
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={width} height={height} className="max-w-full">
            {/* Axes */}
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e5e7eb" />
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e5e7eb" />

            {/* Y ticks */}
            {[min, (min + max) / 2, max].map((v, i) => (
              <g key={i}>
                <text x={4} y={yScale(v) + 4} fontSize={12} fill="#6b7280">{v.toFixed(1)} kg</text>
                <line x1={padding.left} y1={yScale(v)} x2={width - padding.right} y2={yScale(v)} stroke="#f3f4f6" />
              </g>
            ))}

            {/* X labels */}
            {data.map((p, i) => (
              <text key={i} x={xScale(i)} y={height - padding.bottom + 16} fontSize={12} textAnchor="middle" fill="#6b7280">{p.label}</text>
            ))}

            {/* Line path */}
            <path d={path} fill="none" stroke="#10b981" strokeWidth={2} />

            {/* Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(i)} cy={yScale(p.value)} r={3} fill="#10b981" />
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}