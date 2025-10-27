import React from 'react';
import { getInsights } from '@/app/actions/insights';
import { InsightCard } from '@/components/insights/InsightCard';

export const dynamic = 'force-dynamic';

export default async function RecommendationsPage() {
  const insights = await getInsights();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Insights Personalizados</h1>
      <p className="text-sm text-slate-600">Basado en tu historial de entrenamiento y adherencia</p>
      <div className="space-y-3">
        {insights.length === 0 && (
          <div className="text-sm text-slate-600">No hay insights por ahora. Completa algunas sesiones para generar recomendaciones.</div>
        )}
        {insights.map((i) => (
          <InsightCard
            key={i.id}
            type={i.type}
            title={i.title}
            description={i.description}
            icon={i.icon}
            date={i.date}
            severity={i.severity}
            meta={i.meta}
          />
        ))}
      </div>
    </div>
  );
}