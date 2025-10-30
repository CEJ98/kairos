'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PersonalRecords } from '@/types/progress';
import { Trophy, TrendingUp, Zap, Award, Target } from 'lucide-react';

interface PersonalRecordsCardProps {
  records: PersonalRecords;
}

export function PersonalRecordsCard({ records }: PersonalRecordsCardProps) {
  const prData = [
    {
      label: 'Squat 1RM',
      value: `${records.squat}kg`,
      icon: Trophy,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Bench 1RM',
      value: `${records.bench}kg`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Deadlift 1RM',
      value: `${records.deadlift}kg`,
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Volumen Máximo',
      value: `${Math.round(records.totalVolume / 1000)}k kg`,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Racha Más Larga',
      value: `${records.longestStreak} días`,
      icon: Target,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle className="font-poppins">Personal Records</CardTitle>
        </div>
        <CardDescription>Tus mejores marcas personales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {prData.map((pr, index) => {
            const Icon = pr.icon;
            return (
              <div
                key={index}
                className={`
                  rounded-xl p-6 border-2 border-transparent
                  hover:border-gray-200 transition-all
                  bg-gradient-to-br ${pr.bgColor.replace('50', '50/50')} to-white
                `}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${pr.bgColor}
                  `}>
                    <Icon className={`h-6 w-6 ${pr.color}`} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {pr.label}
                  </p>
                  <p className={`text-2xl font-bold ${pr.color}`}>
                    {pr.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
