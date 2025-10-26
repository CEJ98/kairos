'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Weight, TrendingUp, Target, Flame } from 'lucide-react';

interface StatsCardsProps {
  currentStats: {
    weight: number;
    bodyFat: number;
    adherenceRate: number;
    weeklyVolume: number;
  };
}

export function StatsCards({ currentStats }: StatsCardsProps) {
  const stats = [
    {
      label: 'Peso Actual',
      value: `${currentStats.weight}kg`,
      icon: Weight,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      label: 'Grasa Corporal',
      value: `${currentStats.bodyFat}%`,
      icon: TrendingUp,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
    },
    {
      label: 'Adherencia',
      value: `${currentStats.adherenceRate}%`,
      icon: Target,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
    },
    {
      label: 'Volumen Semanal',
      value: `${Math.round(currentStats.weeklyVolume / 1000)}k kg`,
      icon: Flame,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    bg-gradient-to-br ${stat.bgGradient}
                  `}
                >
                  <Icon
                    className={`
                      h-7 w-7 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent
                    `}
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
