import React from 'react';

export type InsightType = 'progress' | 'load' | 'recovery' | 'adherence' | 'volume';
export type InsightSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface InsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  icon?: string;
  date?: Date | string;
  severity?: InsightSeverity;
  meta?: Record<string, any>;
}

const typeColors: Record<InsightType, string> = {
  progress: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  load: 'bg-blue-50 border-blue-200 text-blue-900',
  recovery: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  adherence: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  volume: 'bg-slate-50 border-slate-200 text-slate-900',
};

const severityBadge: Record<InsightSeverity, string> = {
  info: 'bg-slate-200 text-slate-800',
  success: 'bg-emerald-200 text-emerald-800',
  warning: 'bg-yellow-200 text-yellow-900',
  danger: 'bg-red-200 text-red-900',
};

export function InsightCard({ type, title, description, icon = '💡', date, severity = 'info', meta }: InsightCardProps) {
  const colorClass = typeColors[type] || typeColors.volume;
  const badgeClass = severityBadge[severity] || severityBadge.info;

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${colorClass}`}>
      <div className="text-2xl" aria-hidden>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded ${badgeClass}`}>{severity.toUpperCase()}</span>
        </div>
        <p className="text-sm mt-1">{description}</p>
        {meta && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-slate-600">Detalles</summary>
            <pre className="text-xs mt-1 overflow-auto">{JSON.stringify(meta, null, 2)}</pre>
          </details>
        )}
        {date && (
          <p className="text-xs mt-2 text-slate-600">{typeof date === 'string' ? date : date.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}