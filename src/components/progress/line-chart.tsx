"use client"

import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

type Point = { date: string; value: number }

export function LineChart({
  title,
  data,
  color = '#16a34a',
  valueFormatter,
}: {
  title?: string
  data: Point[]
  color?: string
  valueFormatter?: (v: number) => string
}) {
  const formatted = data
    .map(d => ({
      date: new Date(d.date).toLocaleDateString(),
      value: d.value,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="w-full h-64">
      {title && <h3 className="mb-2 text-sm font-medium text-gray-700">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={formatted} margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={['dataMin', 'dataMax']} />
          <Tooltip formatter={(v: any) => (valueFormatter ? valueFormatter(v) : v)} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

